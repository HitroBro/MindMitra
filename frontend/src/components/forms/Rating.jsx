import { useState } from 'react';

const Rating = ({ onSubmit }) => {
  const [value, setValue] = useState(5);
  const [feedback, setFeedback] = useState('');

  const submit = () => {
    if (!value) return;
    onSubmit(value, feedback);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {[1,2,3,4,5].map((n) => (
          <button key={n} onClick={() => setValue(n)} className={`btn btn-xs ${n<=value? 'btn-primary':'btn-outline'}`}>{n}</button>
        ))}
      </div>
      <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="textarea textarea-bordered w-full" placeholder="Optional feedback" />
      <div>
        <button onClick={submit} className="btn btn-sm btn-success">Submit rating</button>
      </div>
    </div>
  );
};

export default Rating;
