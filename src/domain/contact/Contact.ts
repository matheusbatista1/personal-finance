export type ContactColorRole = "primary" | "tertiary" | "secondary";

export interface Contact {
  id: string;
  name: string;
  initial: string;
  colorRole: ContactColorRole;
}
