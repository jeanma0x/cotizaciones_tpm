"use client";

import { ArrowRightIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { DocumentoResumen, type DocumentoResumenData } from "@/components/app/documento-resumen";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function DocumentoVistaRapidaSheet({
  documentoId,
  data,
}: {
  documentoId: string;
  data: DocumentoResumenData;
}) {
  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger
          render={
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Vista rápida">
                  <EyeIcon className="h-4 w-4" />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Vista rápida</TooltipContent>
      </Tooltip>
      <SheetContent className="doc-resumen-sheet flex flex-col gap-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Vista rápida</SheetTitle>
        </SheetHeader>
        <div className="px-4">
          <DocumentoResumen data={data} />
        </div>
        <div className="mt-auto px-4 pb-4">
          <Button className="w-full" render={<Link href={`/documentos/${documentoId}`} />}>
            Ver documento completo
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
