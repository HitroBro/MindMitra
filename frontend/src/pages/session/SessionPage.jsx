import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentApi } from '../../services/appointment.api';

const DEFAULT_ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const SessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingIceRef = useRef([]);
  // ICE servers (including any TURN config) sent by the backend on
  // session:joined. Kept in a ref (not state) since it's only read inside
  // callbacks, never rendered.
  const iceServersRef = useRef(DEFAULT_ICE_SERVERS);
  const [appointment, setAppointment] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [peerLeft, setPeerLeft] = useState(false);
  const { user } = useAuth();

  const isCounselor = appointment && user && String(user._id) === String(appointment.counselor._id || appointment.counselor);

  const getOtherUserId = useCallback(() => {
    if (!appointment || !user) return null;
    const studentId = appointment.student._id || appointment.student;
    const counselorId = appointment.counselor._id || appointment.counselor;
    return String(studentId) === String(user._id) ? counselorId : studentId;
  }, [appointment, user]);

  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) return;
    while (pendingIceRef.current.length) {
      const candidate = pendingIceRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[SessionPage] Failed to flush queued ICE', err);
      }
    }
  }, []);

  const ensurePeerConnection = useCallback(async () => {
    if (pcRef.current) return pcRef.current;

    // Reuse existing camera/mic stream if we already have one (e.g.
    // rebuilding the peer connection after the other participant
    // reconnected) instead of prompting for camera permission again.
    let stream = localStreamRef.current;
    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    }

    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (evt) => {
      console.log('[SessionPage] Remote stream attached');
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = evt.streams[0];
    };

    pc.onicecandidate = (evt) => {
      if (evt.candidate && appointment) {
        const other = getOtherUserId();
        if (other) {
          console.log('[SessionPage] Sending ICE candidate');
          socket.emit('webrtc:ice', { targetUserId: other, candidate: evt.candidate });
        }
      }
    };

    // Connection state monitoring for debugging + auto ICE restart
    pc.onconnectionstatechange = () => {
      console.log('[SessionPage] Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.error('[SessionPage] WebRTC connection failed - restarting ICE');
        pc.restartIce();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[SessionPage] ICE state:', pc.iceConnectionState);
    };

    return pc;
  }, [appointment, socket, getOtherUserId]);

  const createOfferAndSend = useCallback(async () => {
    if (!appointment || !socket) return;
    const pc = await ensurePeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const other = getOtherUserId();
    if (!other) return;

    console.log('[SessionPage] Creating offer and sending to', other);
    socket.emit('webrtc:offer', { targetUserId: other, offer });
  }, [appointment, socket, ensurePeerConnection, getOtherUserId]);

  // Closes just the RTCPeerConnection — used when the remote peer drops so
  // we can rebuild the connection on their rejoin without losing our own
  // camera feed or re-prompting for permission.
  const closePeerConnectionOnly = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingIceRef.current = [];
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  // Full teardown — stops the camera/mic and closes the peer connection.
  // Used on "End session" and on unmount.
  const stopTracksAndClosePeer = useCallback(() => {
    closePeerConnectionOnly();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject = null;
    }
  }, [closePeerConnectionOnly]);

  // Fetch appointment on mount
  useEffect(() => {
    appointmentApi.getBySession(sessionId)
      .then((res) => setAppointment(res.data.data))
      .catch(() => {
        alert('Session not found or you are not a participant');
        navigate(-1);
      });
  }, [sessionId, navigate]);

  // Socket + WebRTC signaling
  useEffect(() => {
    if (!socket || !appointment) return undefined;

    let peerConnectionInitialized = false;

    const initPeerConnection = async () => {
      if (peerConnectionInitialized) return;
      peerConnectionInitialized = true;

      try {
        await ensurePeerConnection();
        console.log('[SessionPage] Peer connection initialized');
      } catch (err) {
        console.error('[SessionPage] Failed to initialize peer connection', err);
        peerConnectionInitialized = false; // Allow retry
      }
    };

    const handleSessionJoined = ({ sessionId: id, iceServers }) => {
      console.log('[SessionPage] Joined session', id);
      if (Array.isArray(iceServers) && iceServers.length) {
        iceServersRef.current = iceServers;
      }
    };

    const handleSessionReady = async ({ sessionId: id }) => {
      console.log('[SessionPage] Session ready', id);
      setPeerLeft(false);
      setSessionReady(true);

      // Ensure peer connection is ready before creating offer (for counselor)
      await initPeerConnection();
      if (isCounselor) {
        console.log('[SessionPage] Counselor is initiator and will create offer');
        createOfferAndSend();
      } else {
        console.log('[SessionPage] Student is waiting for offer');
      }
    };

    // The backend emits this when the other participant disconnects
    // (network blip, tab closed, refresh). Tear down just the peer
    // connection — keep the local camera running — so that when the
    // backend re-emits session:ready on their rejoin, a fresh
    // offer/answer exchange can happen instead of the call staying
    // frozen on the old, now-dead connection.
    const handlePeerLeft = () => {
      console.log('[SessionPage] Peer left the session');
      setPeerLeft(true);
      setSessionReady(false);
      closePeerConnectionOnly();
    };

    const handleOffer = async ({ fromUserId, offer }) => {
      console.log('[SessionPage] Offer received', { fromUserId });
      await initPeerConnection();

      const pc = pcRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { targetUserId: fromUserId, answer });
      console.log('[SessionPage] Answer sent', { targetUserId: fromUserId });
    };

    const handleAnswer = async ({ fromUserId, answer }) => {
      console.log('[SessionPage] Answer received from', fromUserId);
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      flushPendingIce();
    };

    const handleIce = async ({ candidate }) => {
      console.log('[SessionPage] ICE candidate received', candidate?.candidate);
      const pc = pcRef.current;
      if (!pc) return;
      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[SessionPage] addIceCandidate failed', err);
        }
      } else {
        pendingIceRef.current.push(candidate);
        console.log('[SessionPage] Queued ICE candidate until remote description is set');
      }
    };

    const handleSocketConnect = () => {
      console.log('[SessionPage] Socket reconnected');
      socket.emit('session:join', { sessionId });
    };

    socket.on('connect', handleSocketConnect);
    socket.on('session:joined', handleSessionJoined);
    socket.on('session:ready', handleSessionReady);
    socket.on('session:peer-left', handlePeerLeft);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice', handleIce);

    socket.emit('session:join', { sessionId });
    // Don't fire-and-forget; initPeerConnection handles deduplication
    initPeerConnection();

    return () => {
      socket.off('connect', handleSocketConnect);
      socket.off('session:joined', handleSessionJoined);
      socket.off('session:ready', handleSessionReady);
      socket.off('session:peer-left', handlePeerLeft);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice', handleIce);
    };
  }, [socket, appointment, sessionId, isCounselor, ensurePeerConnection, createOfferAndSend, flushPendingIce, closePeerConnectionOnly]);

  // Release the camera/mic and close the peer connection no matter how the
  // user leaves the page (back button, closing the tab, navigating
  // elsewhere in the SPA) — not just via the explicit "End session" button.
  // Previously this cleanup only ran inside handleEnd, so any other exit
  // path left the camera light on and the RTCPeerConnection open.
  useEffect(() => {
    return () => {
      stopTracksAndClosePeer();
    };
  }, [stopTracksAndClosePeer]);

  const handleEnd = async () => {
    try {
      if (!appointment) return;
      await appointmentApi.complete(appointment._id);
      stopTracksAndClosePeer();
      if (user?.role === 'counselor') navigate('/dashboard/counselor/appointments');
      else navigate('/dashboard/student/appointments');
    } catch (err) {
      console.error('[SessionPage] handleEnd error:', err);
      alert('Failed to end session');
    }
  };

  const statusLabel = peerLeft
    ? 'Other participant disconnected — waiting for them to rejoin…'
    : sessionReady
      ? 'Connected'
      : 'Waiting for the other participant to join…';

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-xl font-semibold mb-4">Session: {sessionId}</h1>
      <div className="mb-4 flex items-center gap-3">
        <span className={`badge ${sessionReady && !peerLeft ? 'badge-success' : 'badge-warning'}`}>{statusLabel}</span>
        <button onClick={handleEnd} className="btn btn-ghost">End session</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-teal-700 mb-2">Your camera</p>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-64 bg-black rounded" />
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-teal-700 mb-2">Remote</p>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-64 bg-black rounded" />
        </div>
      </div>
    </div>
  );
};

export default SessionPage;