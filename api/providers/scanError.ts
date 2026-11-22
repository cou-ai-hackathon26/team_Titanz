// An error with an HTTP status, so the endpoint can send the right code to the app.
export class ScanError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// What every AI helper returns: the AI's JSON answer (not yet cleaned) and the model that answered.
export type AiAnswer = { raw: unknown; model: string };
