import { BatteryIcon, CellularIcon, WifiIcon } from "./icons";

export function IosStatusBar() {
  return (
    <div className="ios-status-bar" aria-hidden="true">
      <span className="ios-status-time">9:41</span>
      <span className="dynamic-island" />
      <span className="ios-status-icons">
        <CellularIcon />
        <WifiIcon />
        <BatteryIcon />
      </span>
    </div>
  );
}
