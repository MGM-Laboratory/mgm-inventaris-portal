"use client";

import { useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { findModelByName, useAppState, type UnitDetails } from "@/lib/store";

const PLACES = ["F10.5, Lemari A", "F10.5, Lemari B", "F10.6, Rak 1", "F10.6, Rak 2"];
const CONDITIONS = ["Baik", "Ada goresan ringan", "Perlu servis"];

/** Nilai pilihan "barang baru" dan "kategori baru". */
export const NEW = "__baru";

export type UnitFormValues = UnitDetails & {
  /** id barang yang ada, atau NEW untuk barang yang diketik sendiri. */
  modelId: string;
  newName: string;
  /** id kategori yang ada, atau NEW bila newCategory diisi. */
  categoryId: string;
  newCategory: string;
  count: number;
};

type Errors = Partial<
  Record<
    "modelId" | "newName" | "categoryId" | "newCategory" | "count" | "serial" | "condition" | "place",
    string
  >
>;

/**
 * Formulir aset. Mode tambah mengetik barang baru (dengan kategori yang dipilih
 * atau ditambah sendiri) atau memilih barang yang sudah ada, lalu jumlah unit;
 * mode ubah hanya mengisi data unit yang sudah ada.
 */
export function UnitForm({
  mode,
  initial,
  editingTag,
  onSubmit,
  submitLabel,
}: {
  mode: "tambah" | "ubah";
  initial?: UnitDetails;
  editingTag?: string;
  onSubmit: (v: UnitFormValues) => void;
  submitLabel: string;
}) {
  const { units, models, categories } = useAppState();
  const [modelId, setModelId] = useState(NEW);
  const [newName, setNewName] = useState("");
  const [categoryId, setCategoryId] = useState(categories.length ? "" : NEW);
  const [newCategory, setNewCategory] = useState("");
  const [count, setCount] = useState("1");
  const [serial, setSerial] = useState(initial?.serial ?? "");
  const [condition, setCondition] = useState(initial?.condition ?? "Baik");
  const [place, setPlace] = useState(initial?.place ?? "");
  const [errors, setErrors] = useState<Errors>({});

  const n = Number(count);
  const serialAllowed = mode === "ubah" || n === 1;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    const isNew = modelId === NEW;
    if (mode === "tambah" && isNew) {
      const name = newName.trim();
      if (name.length < 2) next.newName = "Isi nama barang, misalnya Proyektor.";
      else if (findModelByName(name))
        next.newName = "Barang ini sudah ada. Pilih dari daftar Barang untuk menambah unitnya.";
      if (!categoryId) next.categoryId = "Pilih kategori, atau tambah kategori baru.";
      else if (categoryId === NEW && newCategory.trim().length < 2)
        next.newCategory = "Isi nama kategori baru.";
    }
    if (mode === "tambah" && (!Number.isInteger(n) || n < 1 || n > 20))
      next.count = "Isi jumlah unit 1 sampai 20.";
    const s = serial.trim();
    if (serialAllowed && s) {
      if (s.length < 3) next.serial = "Nomor seri minimal 3 karakter, atau kosongkan.";
      else {
        const dup = units.find(
          (u) => u.serial.toLowerCase() === s.toLowerCase() && u.tag !== editingTag,
        );
        if (dup) next.serial = `Nomor seri ini sudah dipakai oleh ${dup.tag}.`;
      }
    }
    if (condition.trim().length < 2) next.condition = "Isi kondisi unit.";
    if (place.trim().length < 2) next.place = "Isi tempat unit disimpan di lab.";
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    onSubmit({
      modelId,
      newName: newName.trim(),
      categoryId,
      newCategory: categoryId === NEW ? newCategory.trim() : "",
      count: mode === "tambah" ? n : 1,
      serial: s,
      condition: condition.trim(),
      place: place.trim(),
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {mode === "tambah" ? (
        <>
          <div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
            <Field label="Barang" htmlFor="modelId" error={errors.modelId}>
              <select
                id="modelId"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className={inputClass}
              >
                <option value={NEW}>Barang baru (ketik sendiri)</option>
                {models.length ? (
                  <optgroup label="Tambah unit untuk barang yang sudah ada">
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
            </Field>
            <Field label="Jumlah unit" htmlFor="count" error={errors.count}>
              <input
                id="count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                aria-invalid={Boolean(errors.count)}
                className={`${inputClass} tnum`}
              />
            </Field>
          </div>

          {modelId === NEW ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nama barang" htmlFor="newName" error={errors.newName}>
                <input
                  id="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  aria-invalid={Boolean(errors.newName)}
                  className={inputClass}
                />
              </Field>
              <Field label="Kategori" htmlFor="categoryId" error={errors.categoryId}>
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  aria-invalid={Boolean(errors.categoryId)}
                  className={inputClass}
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value={NEW}>Kategori baru…</option>
                </select>
              </Field>
              {categoryId === NEW ? (
                <div className="sm:col-start-2">
                  <Field label="Nama kategori baru" htmlFor="newCategory" error={errors.newCategory}>
                    <input
                      id="newCategory"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      aria-invalid={Boolean(errors.newCategory)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <Field
        label="Nomor seri"
        htmlFor="serial"
        error={errors.serial}
        hint={
          serialAllowed
            ? "Boleh dikosongkan dan diisi nanti."
            : "Untuk lebih dari satu unit, isi nomor seri per unit lewat Ubah setelah ditambahkan."
        }
      >
        <input
          id="serial"
          value={serialAllowed ? serial : ""}
          onChange={(e) => setSerial(e.target.value)}
          disabled={!serialAllowed}
          aria-invalid={Boolean(errors.serial)}
          className={`${inputClass} tnum font-mono disabled:opacity-50`}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Kondisi" htmlFor="condition" error={errors.condition}>
          <input
            id="condition"
            list="kondisi-saran"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            aria-invalid={Boolean(errors.condition)}
            className={inputClass}
          />
          <datalist id="kondisi-saran">
            {CONDITIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field
          label="Tempat di lab"
          htmlFor="place"
          error={errors.place}
          hint="Ruangan dan rak atau lemari."
        >
          <input
            id="place"
            list="tempat-saran"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            aria-invalid={Boolean(errors.place)}
            className={inputClass}
          />
          <datalist id="tempat-saran">
            {PLACES.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
      </div>

      <div>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
