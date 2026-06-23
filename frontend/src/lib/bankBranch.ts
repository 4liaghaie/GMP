import { bankList } from "@/lib/branchList";

type Branch = {
  value: string | number;
  label: string;
};

type BankWithBranches = {
  branches?: readonly Branch[];
};

export function formatBankBranch(value: unknown) {
  const code = String(value ?? "").trim();
  if (!code) return "";

  for (const bank of bankList as readonly BankWithBranches[]) {
    const branch = (bank.branches || []).find(
      (item) => String(item.value) === code,
    );
    if (branch) return `${branch.label} (${code})`;
  }

  return code;
}
