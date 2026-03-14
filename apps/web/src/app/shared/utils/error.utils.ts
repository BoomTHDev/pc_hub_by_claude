export interface ApiErrorBody {
  message?: string;
  code?: string;
}

function getStringProp(obj: object, key: string): string | undefined {
  if (key in obj) {
    const val = Reflect.get(obj, key);
    return typeof val === 'string' ? val : undefined;
  }
  return undefined;
}

export function extractErrorBody(errorPayload: unknown): ApiErrorBody {
  if (typeof errorPayload !== 'object' || errorPayload === null) {
    return {};
  }

  return {
    message: getStringProp(errorPayload, 'message'),
    code: getStringProp(errorPayload, 'code'),
  };
}
