const attribute = 'data-workos-keyboard';
const sessions = new WeakMap<Document, { users: number; stop: () => void }>();

// 文档级监听让原生 Portal 中的控件使用同样的输入方式判定。
export function trackKeyboardFocus(document: Document) {
  let session = sessions.get(document);
  if (!session) {
    const root = document.documentElement;
    let tabPending = false;
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey) tabPending = true;
    };
    const keyUp = (event: KeyboardEvent) => {
      if (event.key === 'Tab') tabPending = false;
    };
    const focusIn = () => {
      if (!tabPending) return;
      tabPending = false;
      root.setAttribute(attribute, '');
    };
    const pointerDown = () => {
      tabPending = false;
      root.removeAttribute(attribute);
    };
    document.addEventListener('keydown', keyDown, true);
    document.addEventListener('keyup', keyUp, true);
    document.addEventListener('focusin', focusIn, true);
    document.addEventListener('pointerdown', pointerDown, true);
    session = {
      users: 0,
      stop: () => {
        document.removeEventListener('keydown', keyDown, true);
        document.removeEventListener('keyup', keyUp, true);
        document.removeEventListener('focusin', focusIn, true);
        document.removeEventListener('pointerdown', pointerDown, true);
        root.removeAttribute(attribute);
      },
    };
    sessions.set(document, session);
  }
  session.users += 1;
  return () => {
    session.users -= 1;
    if (session.users === 0) {
      session.stop();
      sessions.delete(document);
    }
  };
}
