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
  // Outgoing ICE candidates generated before the appointment is fetched.
  // onicecandidate fires as soon as the PC is created, but appointment
  // loads async — without this queue, early candidates are silently
  // dropped, leaving one side with a black screen.
  const outgoingIceRef = useRef([]);
  // ICE servers (including any TURN config) sent by the backend on
  // session:joined. Kept in a ref (not state) since it's only read inside
  // callbacks, never rendered.
  const iceServersRef = useRef(DEFAULT_ICE_SERVERS);
  const [appointment, setAppointment] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [peerLeft, setPeerLeft] = useState(false);
  // Camera/mic state - requires explicit user action to start
  const [mediaStarted, setMediaStarted] = useState(false);
  // Real WebRTC connection state (from RTCPeerConnection.connectionState):
  // 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed'.
  // This is what actually reflects whether media is flowing — sessionReady
  // only means both participants joined the signaling room, which can be
  // true while the peer-to-peer media connection has failed (e.g. no TURN
  // server available for a NAT type STUN can't traverse).
  const [pcState, setPcState] = useState('new');
  // Real-time connection quality stats polled from RTCPeerConnection.getStats()
  const [stats, setStats] = useState({
    bitrate: 0,
    packetsLost: 0,
    packetsReceived: 0,
    roundTripTime: null,
    iceCandidateType: null,
    iceConnectionState: null,
    remoteResolution: null,
    remoteFps: null,
  });
  const [showStats, setShowStats] = useState(false);
  const statsIntervalRef = useRef(null);
  const prevBytesRef = useRef({ sent: 0, received: 0, timestamp: 0 });
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

  // Flush outgoing ICE candidates that were queued before appointment loaded.
  const flushOutgoingIce = useCallback(() => {
    if (!appointment || !socket) return;
    const other = getOtherUserId();
    if (!other) return;
    while (outgoingIceRef.current.length) {
      const candidate = outgoingIceRef.current.shift();
      socket.emit('webrtc:ice', { targetUserId: other, candidate });
    }
  }, [appointment, socket, getOtherUserId]);

  // Creates the RTCPeerConnection and attaches the local stream.
  // Reuses existing camera/mic stream if we already have one (e.g.
  // rebuilding the peer connection after the other participant
  // reconnected) instead of prompting for camera permission again.
  const ensurePeerConnection = useCallback(async () => {
    if (pcRef.current) return pcRef.current;

    let stream = localStreamRef.current;
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('[SessionPage] getUserMedia failed:', err);
        throw err;
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
      if (evt.candidate) {
        const other = getOtherUserId();
        if (other && appointment) {
          console.log('[SessionPage] Sending ICE candidate', evt.candidate.type, evt.candidate.candidate);
          socket.emit('webrtc:ice', { targetUserId: other, candidate: evt.candidate });
        } else {
          // Queue until appointment loads so candidates aren't silently dropped
          outgoingIceRef.current.push(evt.candidate);
        }
      }
    };

    // These fire on every ICE/connection transition. 'failed' here — with
    // no TURN server configured — almost always means the peers are behind
    // NAT types that STUN alone can't traverse (very common across
    // different networks/mobile data), and a TURN relay is required.
    pc.onconnectionstatechange = () => {
      console.log('[SessionPage] connectionState:', pc.connectionState);
      setPcState(pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.error('[SessionPage] Peer connection failed — likely missing TURN server for this NAT type');
        // Auto ICE restart to attempt recovery
        pc.restartIce();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[SessionPage] iceConnectionState:', pc.iceConnectionState);
    };

    setPcState(pc.connectionState);
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
    outgoingIceRef.current = [];
    prevBytesRef.current = { sent: 0, received: 0, timestamp: 0 };
    setPcState('new');
    setStats({
      bitrate: 0, packetsLost: 0, packetsReceived: 0,
      roundTripTime: null, iceCandidateType: null, iceConnectionState: null,
      remoteResolution: null, remoteFps: null,
    });
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

      // Flush any outgoing ICE candidates that were queued before appointment loaded
      flushOutgoingIce();

      // Only initialize peer connection if media has been started by user
      if (mediaStarted) {
        await initPeerConnection();
        if (isCounselor) {
          console.log('[SessionPage] Counselor is initiator and will create offer');
          createOfferAndSend();
        } else {
          console.log('[SessionPage] Student is waiting for offer');
        }
      } else {
        console.log('[SessionPage] Waiting for user to start camera');
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
      // Also flush any outgoing ICE candidates that were queued before
      // the offer arrived (student started camera before counselor sent offer)
      flushOutgoingIce();
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
      flushOutgoingIce();
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
    // Don't auto-init - wait for user to click "Start camera"
    if (mediaStarted) {
      initPeerConnection();
    }

    return () => {
      socket.off('connect', handleSocketConnect);
      socket.off('session:joined', handleSessionJoined);
      socket.off('session:ready', handleSessionReady);
      socket.off('session:peer-left', handlePeerLeft);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice', handleIce);
    };
  }, [socket, appointment, sessionId, isCounselor, mediaStarted, ensurePeerConnection, createOfferAndSend, flushPendingIce, flushOutgoingIce, closePeerConnectionOnly, handleStartMedia]);

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

  // Handler for starting camera/mic - requires user gesture
  // Poll RTCPeerConnection.getStats() every 2s for connection quality metrics
  useEffect(() => {
    if (!mediaStarted) {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      return;
    }

    statsIntervalRef.current = setInterval(async () => {
      const pc = pcRef.current;
      if (!pc || pc.connectionState === 'closed') return;

      try {
        const report = await pc.getStats();
        let bytesSent = 0;
        let bytesReceived = 0;
        let packetsLost = 0;
        let packetsReceived = 0;
        let roundTripTime = null;
        let iceCandidateType = null;
        let remoteResolution = null;
        let remoteFps = null;
        let currentTimestamp = 0;

        report.forEach((entry) => {
          if (entry.type === 'candidate-pair' && entry.nominated) {
            bytesSent = entry.bytesSent || 0;
            bytesReceived = entry.bytesReceived || 0;
            currentTimestamp = entry.timestamp || Date.now();
            if (entry.currentRoundTripTime != null) {
              roundTripTime = Math.round(entry.currentRoundTripTime * 1000); // ms
            }
            // Get ICE candidate type from the local candidate referenced by the
            // nominated pair — more reliable than scanning all local-candidate entries
            if (entry.localCandidateId) {
              const localCandidate = report.get(entry.localCandidateId);
              if (localCandidate && localCandidate.candidateType) {
                iceCandidateType = localCandidate.candidateType;
              }
            }
          }

          if (entry.type === 'inbound-rtp' && entry.kind === 'video') {
            packetsLost = entry.packetsLost || 0;
            packetsReceived = entry.packetsReceived || 0;
            remoteFps = entry.framesPerSecond || null;
            if (entry.frameWidth && entry.frameHeight) {
              remoteResolution = `${entry.frameWidth}×${entry.frameHeight}`;
            }
          }
        });

        // Calculate bitrate from delta
        const prev = prevBytesRef.current;
        let bitrate = 0;
        if (currentTimestamp > prev.timestamp) {
          const elapsedSec = (currentTimestamp - prev.timestamp) / 1000;
          if (elapsedSec > 0 && prev.timestamp > 0) {
            bitrate = Math.round(((bytesSent - prev.sent) * 8) / elapsedSec / 1000); // kbps
          }
        }
        // Always update — on first valid poll this seeds the baseline
        prevBytesRef.current = { sent: bytesSent, received: bytesReceived, timestamp: currentTimestamp };

        setStats({
          bitrate: Math.max(0, bitrate),
          packetsLost,
          packetsReceived,
          roundTripTime,
          iceCandidateType,
          iceConnectionState: pc.iceConnectionState,
          remoteResolution,
          remoteFps,
        });
      } catch (err) {
        console.error('[SessionPage] getStats error:', err);
      }
    }, 2000);

    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, [mediaStarted]);

  const handleStartMedia = useCallback(async () => {
    if (mediaStarted) return;
    try {
      setMediaStarted(true);
      await ensurePeerConnection();
      flushOutgoingIce();
      console.log('[SessionPage] Media started by user');
      if (isCounselor && sessionReady) {
        console.log('[SessionPage] Counselor creating offer after media start');
        createOfferAndSend();
      }
    } catch (err) {
      console.error('[SessionPage] Failed to start media:', err);
      setMediaStarted(false);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  }, [mediaStarted, isCounselor, sessionReady, ensurePeerConnection, createOfferAndSend, flushOutgoingIce]);

  const statusLabel = peerLeft
    ? 'Other participant disconnected — waiting for them to rejoin…'
    : pcState === 'connected'
      ? 'Connected'
      : pcState === 'failed' || pcState === 'disconnected'
        ? 'Connection failed — this network may need a TURN server'
        : sessionReady
          ? 'Connecting…'
          : 'Waiting for the other participant to join…';

  const badgeClass =
    pcState === 'connected' && !peerLeft
      ? 'badge-success'
      : pcState === 'failed' || pcState === 'disconnected'
        ? 'badge-error'
        : 'badge-warning';

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-xl font-semibold mb-4">Session: {sessionId}</h1>
      <div className="mb-4 flex items-center gap-3">
        <span className={`badge ${badgeClass}`}>{statusLabel}</span>
        {!mediaStarted ? (
          <button onClick={handleStartMedia} className="btn btn-primary">
            Start camera & connect
          </button>
        ) : (
          <span className="text-sm text-teal-700">Camera active</span>
        )}
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

      {/* Connection Quality Stats Panel */}
      <div className="mt-4">
        <button
          onClick={() => setShowStats(!showStats)}
          className="text-xs text-teal-600/70 hover:text-teal-700 flex items-center gap-1 transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform ${showStats ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Connection stats
        </button>

        {showStats && (
          <div className="mt-2 bg-white rounded-lg p-4 shadow text-xs font-mono text-teal-800 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <span className="text-teal-500 block mb-0.5">Bitrate</span>
              <span className="font-semibold text-sm">{stats.bitrate} kbps</span>
            </div>
            <div>
              <span className="text-teal-500 block mb-0.5">RTT</span>
              <span className="font-semibold text-sm">
                {stats.roundTripTime != null ? `${stats.roundTripTime} ms` : '—'}
              </span>
            </div>
            <div>
              <span className="text-teal-500 block mb-0.5">ICE Type</span>
              <span className="font-semibold text-sm capitalize">
                {stats.iceCandidateType || '—'}
              </span>
            </div>
            <div>
              <span className="text-teal-500 block mb-0.5">Connection</span>
              <span className="font-semibold text-sm capitalize">
                {stats.iceConnectionState || pcState}
              </span>
            </div>
            <div>
              <span className="text-teal-500 block mb-0.5">Resolution</span>
              <span className="font-semibold text-sm">
                {stats.remoteResolution || '—'}
              </span>
            </div>
            <div>
              <span className="text-teal-500 block mb-0.5">FPS</span>
              <span className="font-semibold text-sm">
                {stats.remoteFps != null ? stats.remoteFps : '—'}
              </span>
            </div>
            <div>
              <span className="text-teal-500 block mb-0.5">Packets Lost</span>
              <span className="font-semibold text-sm">
                {stats.packetsLost}
                {stats.packetsReceived > 0 && (
                  <span className="text-teal-400 ml-1">
                    ({((stats.packetsLost / (stats.packetsLost + stats.packetsReceived)) * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-teal-500 block mb-0.5">Packets Recv</span>
              <span className="font-semibold text-sm">{stats.packetsReceived}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionPage;