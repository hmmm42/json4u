export type DocUpdate = {
  version?: number;
  timestamp: number;
};

let channel: BroadcastChannel | undefined;

export function getDocChannel() {
  if (typeof window === "undefined") {
    return undefined;
  }
  if (!channel) {
    channel = new BroadcastChannel("json4u:doc");
  }
  return channel;
}

export function postDocUpdate(update: DocUpdate) {
  const ch = getDocChannel();
  ch?.postMessage(update);
}

export function onDocUpdate(cb: (u: DocUpdate) => void) {
  const ch = getDocChannel();
  if (!ch) {
    return () => { };
  }
  const handler = (ev: MessageEvent) => {
    cb(ev.data as DocUpdate);
  };
  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}

