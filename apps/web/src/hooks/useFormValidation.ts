"use client";

import { useState, useCallback } from "react";

type Validator<T> = (_value: T) => string | null;

/**
 * Simple form field validation hook.
 * Runs the validator on blur and on each change after first blur.
 */
export function useFieldValidation<T>(validator: Validator<T>, initial?: T) {
  const [value, setValue]   = useState<T>(initial as T);
  const [error, setError]   = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const onChange = useCallback((v: T) => {
    setValue(v);
    if (touched) setError(validator(v));
  }, [validator, touched]);

  const onBlur = useCallback(() => {
    setTouched(true);
    setError(validator(value));
  }, [validator, value]);

  const reset = useCallback(() => {
    setValue(initial as T);
    setError(null);
    setTouched(false);
  }, [initial]);

  return { value, error, touched, onChange, onBlur, reset, isValid: error === null && touched };
}
