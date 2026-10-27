import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Modal from "../utils/ModalSecondary";
import Category from "../sidebar";
import { useLocale } from "../../contexts/LocaleContext";

export default function CategoryModal({ open, controller, selectedCategoryId }) {
  const router = useRouter();
  const { t } = useLocale();
  const latest = useRef({ open, controller });
  latest.current = { open, controller };

  // Close after following a link (the layout, and this modal, stay mounted).
  useEffect(() => {
    const close = () => {
      if (latest.current.open) latest.current.controller(false)({ type: "route", preventDefault() {} });
    };
    router.events.on("routeChangeComplete", close);
    return () => router.events.off("routeChangeComplete", close);
  }, [router]);

  return (
    <Modal open={open} controller={controller} title={t("categories")}>
      {open && <Category mode="categories" selectedCategoryId={selectedCategoryId} />}
    </Modal>
  );
}
