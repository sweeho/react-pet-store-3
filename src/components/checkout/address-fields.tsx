import type { ContactInfo } from "@/types/checkout";

export type AddressValues = Record<keyof ContactInfo, string>;

export interface AddressFieldsProps {
  step: number;
  title: string;
  hint?: string;
  suffix: "_a" | "_b";
  values: AddressValues;
  onChange: (key: keyof ContactInfo, value: string) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
  before?: React.ReactNode;
  after?: React.ReactNode;
}

export function AddressFields(props: AddressFieldsProps): React.ReactElement {
  void props;
  throw new Error("VortexNotImplemented");
}
