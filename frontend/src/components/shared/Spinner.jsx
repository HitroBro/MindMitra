const Spinner = ({ full = false }) => (
  <div className={`flex items-center justify-center ${full ? 'min-h-screen' : 'py-10'}`}>
    <span className="loading loading-spinner loading-lg text-teal-600" />
  </div>
);

export default Spinner;
