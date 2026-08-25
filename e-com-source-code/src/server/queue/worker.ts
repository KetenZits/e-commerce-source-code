import { startWorker } from "./index";

const worker = startWorker();
if (worker) {
  worker.on("ready", () => console.log("BullMQ worker ready"));
  worker.on("failed", (job, error) => console.error("Job failed", job?.name, error));
}
