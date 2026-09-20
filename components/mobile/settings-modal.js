import Modal from "../utils/ModalSecondary";
import SettingsContent from "../settings";

export default function SettingsModal({ open, controller }) {
  return (
    <Modal //
      open={open}
      controller={controller}
      title="Settings"
    >
      {open && <SettingsContent />}
    </Modal>
  );
}
