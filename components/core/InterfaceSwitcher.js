import { useId, useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useLocale } from "../../contexts/LocaleContext";
import { catalogName } from "../../lib/i18n";
import { INTERFACE_LANGUAGES, INTERNATIONAL, writeInterfaceCookie } from "../../lib/language";
import LanguageIcon from "../icons/Language";
import CheckIcon from "../icons/Check";
import styles from "./InterfaceSwitcher.module.scss";

// The interface language menu of an international site (config/countries.json
// "international": ac), listing the catalogs by their own names: "English ▾" with a globe
// in the desktop header (variant "desktop"), the globe alone in the phone headers
// ("phone"), a row of the phone menu ("menu"). Choosing one saves it in the hadith_ui
// cookie and reloads the page, which the server renders in it (lib/language.js
// resolveInterfaceLanguage). Nothing on a country's site: its interface is the country's.
export default function InterfaceSwitcher({ variant = "desktop", className = "" }) {
  const { t, ui } = useLocale();
  const [anchor, setAnchor] = useState(null);
  const menuId = `interface-menu-${useId().replace(/:/g, "")}`;
  if (!INTERNATIONAL) return null;

  const open = Boolean(anchor);
  const name = catalogName(ui);
  const label = `${t("interfaceLanguage")}: ${name}`;

  const choose = (code) => {
    setAnchor(null);
    if (code === ui) return;
    writeInterfaceCookie(code);
    window.location.reload();
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.button} ${styles[variant] || ""} ${className}`}
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label={label}
        title={variant === "menu" ? undefined : t("interfaceLanguage")}
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
        aria-controls={open ? menuId : undefined}
        data-interface={ui}
      >
        <LanguageIcon />
        {variant === "desktop" && (
          <>
            <span className={styles.name} lang={ui}>
              {name}
            </span>
            <span className={styles.caret} aria-hidden="true" />
          </>
        )}
        {variant === "menu" && (
          <span className={styles.text}>
            {t("interfaceLanguage")}: <span lang={ui}>{name}</span>
          </span>
        )}
      </button>

      <Menu
        id={menuId}
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: variant === "menu" ? "left" : "right" }}
        transformOrigin={{ vertical: "top", horizontal: variant === "menu" ? "left" : "right" }}
        disableScrollLock
        classes={{ paper: styles.paper }}
        slotProps={{ list: { "aria-label": t("interfaceLanguage") } }}
      >
        {INTERFACE_LANGUAGES.map((code) => (
          <MenuItem
            key={code}
            role="menuitemradio"
            aria-checked={code === ui ? "true" : "false"}
            selected={code === ui}
            onClick={() => choose(code)}
            className={styles.item}
            data-interface={code}
          >
            <span className={styles.itemName} lang={code}>
              {catalogName(code)}
            </span>
            <span className={styles.check} aria-hidden="true">
              {code === ui && <CheckIcon />}
            </span>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
