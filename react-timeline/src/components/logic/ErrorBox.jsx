export default function ErrorBox({ error }) {
  return (
    <div className="error-box">
      <p className="error-title">Error:</p>
      <p>{error}</p>
    </div>
  );
}