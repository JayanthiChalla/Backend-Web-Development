'use strict';

const { Worker } = require('bullmq');
const { connection } = require('./queue');
const { transporter } = require('./email');

const worker = new Worker(
  'email',
  async (job) => {
    if (job.name === 'otp') {
      const { to, otp } = job.data;

      const result = await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: 'Email Verification OTP',
        text: `Your email verification OTP is ${otp}. It is valid for 10 minutes.`,
      });

      console.log(`OTP email sent to ${to}`);
      return result;
    }

    throw new Error(`Unsupported job type: ${job.name}`);
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed: ${err.message}`);
});

module.exports = { worker };