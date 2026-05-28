export function Switch({ on, onToggle }) {
  return (
    <button
      className={`switch ${on ? 'on' : 'off'}`}
      onClick={onToggle}
      aria-checked={on}
      role="switch"
      type="button"
    />
  );
}
