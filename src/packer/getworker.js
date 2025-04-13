export async function getWorker() {
  let workerURL;
  let chatstatURL;
  let chatstatContent;

  try {
    // eslint-disable-next-line no-undef
    workerURL = $fs.url("creator.worker.js");
    // eslint-disable-next-line no-undef
    chatstatContent = $fs.str("chatstat.iife.js");
  } catch {
    workerURL = "/dist/chatstatworker/chatstat.worker.iife.js";
    chatstatURL = "/dist/chatstat/chatstat.iife.js";
  }

  const myWebWorker = new Worker(workerURL);

  if (chatstatContent) {
    myWebWorker.postMessage({ mainScript: chatstatContent });
  } else {
    chatstatContent = await fetch(chatstatURL).then((r) => r.text());
    console.log(chatstatContent.length);
    myWebWorker.postMessage({ mainScript: chatstatContent });
  }

  return myWebWorker;
}
