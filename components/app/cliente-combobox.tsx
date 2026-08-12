"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

type ClienteItem = { value: string; label: string };

export function ClienteCombobox({
  clientes,
  value,
  onValueChange,
  placeholder = "Buscá un cliente por nombre…",
}: {
  clientes: { id: string; nombre: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}) {
  const items: ClienteItem[] = clientes.map((c) => ({ value: c.id, label: c.nombre }));

  return (
    <Combobox
      items={items}
      itemToStringLabel={(item: ClienteItem) => item.label}
      itemToStringValue={(item: ClienteItem) => item.value}
      value={items.find((i) => i.value === value) ?? null}
      onValueChange={(item: ClienteItem | null) => onValueChange(item?.value ?? "")}
    >
      <ComboboxInput placeholder={placeholder} showClear />
      <ComboboxContent>
        <ComboboxEmpty>No se encontró ningún cliente.</ComboboxEmpty>
        <ComboboxList>
          {(item: ClienteItem) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
