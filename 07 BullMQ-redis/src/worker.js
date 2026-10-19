import {Worker} from "bullmq";
import {connection} from "./queue.js";

const worker = new Worker(
    "emails",
    async (Job) => {
        console.log("Processing email job...", Job.id, Job.name, Job.data);
        (await new Promise((resolve) => setTimeout(resolve, 2000)),
        console.log("Email job completed!", Job.id, Job.name, Job.data));
    },
    {connection}
)

worker.on("completed", (Job) => {
    console.log("Job completed!", Job.id, Job.name, Job.data);
});

worker.on("failed", (Job, err) => {
    console.log("Job failed!", Job.id, Job.name, Job.data, err);
});