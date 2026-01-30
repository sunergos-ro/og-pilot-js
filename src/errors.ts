export class OgPilotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OgPilotError";
  }
}

export class ConfigurationError extends OgPilotError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class RequestError extends OgPilotError {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "RequestError";
    this.status = status;
  }
}
