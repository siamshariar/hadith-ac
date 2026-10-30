import Modal from "../utils/ModalSecondary";
import SettingsContent from "../settings";
import { useLocale } from "../../contexts/LocaleContext";

export default function SettingsModal({ open, controller }) {
  const { t } = useLocale();
  return (
    <Modal //
      open={open}
      controller={controller}
      title={t("settingsTitle")}
    >
      {open && <SettingsContent />}
    </Modal>
  );
}
