import { useContext, useMemo } from 'react';
import { Toolbar as WxToolbar } from '@svar-ui/react-toolbar';
import { useStoreLater } from '@svar-ui/lib-react';
import {
  handleAction,
  defaultToolbarButtons,
  isHandledAction,
} from '@svar-ui/gantt-store';
import { locale } from '@svar-ui/lib-dom';
import { en } from '@svar-ui/gantt-locales';
import { context } from '@svar-ui/react-core';

export default function Toolbar({
  api = null,
  items = [...defaultToolbarButtons],
}) {
  const i18nCtx = useContext(context.i18n);
  const i18nLocal = useMemo(() => (i18nCtx ? i18nCtx : locale(en)), [i18nCtx]);
  const _ = useMemo(() => i18nLocal.getGroup('gantt'), [i18nLocal]);

  const rSelected = useStoreLater(api, "_selected");
  const rTasks = useStoreLater(api, "_tasks");

  const finalItems = useMemo(() => {
    return items.map((b) => {
      let item = { ...b, disabled: false };
      item.handler = isHandledAction(defaultToolbarButtons, item.id)
        ? (it) => handleAction(api, it.id, null, _)
        : item.handler;
      if (item.text) item.text = _(item.text);
      if (item.menuText) item.menuText = _(item.menuText);
      return item;
    });
  }, [items, api, _]);

  const buttons = useMemo(() => {
    if (api) {
      if (rSelected?.length) {
        return finalItems.map((item) => {
          if (!item.check) return item;
          const isDisabled = rSelected.some(
            (task) => !item.check(task, rTasks),
          );
          return { ...item, disabled: isDisabled };
        });
      }
    }
    return [{ ...finalItems[0], disabled: false }];
  }, [api, rSelected, rTasks, finalItems]);

  if (!i18nCtx) {
    return (
      <context.i18n.Provider value={i18nLocal}>
        <WxToolbar items={buttons} />
      </context.i18n.Provider>
    );
  }

  return <WxToolbar items={buttons} />;
}
