import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentApi } from '../../services/appointment.api';

const SessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const [appointment, setAppointment] = useState(null);
  const [started, setStarted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // load appointment details by sessionId
    appointmentApi.getBySession(sessionId).then((res) => setAppointment(res.data.data)).catch(() => {
      alert('Session not found or you are not a participant');
      navigate(-1);
    });
  }, [sessionId]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleOffer = async ({ fromUserId, offer }) => {
      if (!pcRef.current) await startLocalAndCreatePeer(false);
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('webrtc:answer', { targetUserId: fromUserId, answer });
    };

    const handleAnswer = async ({ answer }) => {
      if (pcRef.current) await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIce = async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
      }
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice', handleIce);

    // Try to join session room when socket connects
    if (socket && appointment) {
      socket.emit('session:join', { sessionId });
    }

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice', handleIce);
    };
  }, [socket]);

  const startLocalAndCreatePeer = async (isInitiator = true) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (evt) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = evt.streams[0];
    };

    pc.onicecandidate = (evt) => {
      if (evt.candidate && appointment) {
        const other = getOtherUserId();
        socket.emit('webrtc:ice', { targetUserId: other, candidate: evt.candidate });
      }
    };

    setStarted(true);

    if (isInitiator && appointment) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const other = getOtherUserId();
      socket.emit('webrtc:offer', { targetUserId: other, offer });
    }

    return pc;
  };

  const getOtherUserId = () => {
    if (!appointment || !user) return null;
    const studentId = appointment.student._id || appointment.student;
    const counselorId = appointment.counselor._id || appointment.counselor;
    return String(studentId) === String(user._id) ? counselorId : studentId;
  };

  const handleStart = async () => {
    try {
      await startLocalAndCreatePeer(true);
    } catch (err) {
      console.error(err);
      alert('Unable to start media or peer connection');
    }
  };

  const handleEnd = async () => {
    try {
      if (!appointment) return;
      await appointmentApi.complete(appointment._id);
      if (pcRef.current) {
        pcRef.current.getSenders().forEach((s) => { if (s.track) s.track.stop(); });
        pcRef.current.close();
      }
      // route based on role
      if (user?.role === 'counselor') navigate('/dashboard/counselor/appointments');
      else navigate('/dashboard/student/appointments');
    } catch (err) {
      alert('Failed to end session');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-xl font-semibold mb-4">Session: {sessionId}</h1>
      <div className="mb-4">
        <button onClick={handleStart} disabled={started} className="btn btn-primary mr-2">Start camera & connect</button>
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
