/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentProps, useCallback, useMemo, useState } from "react"
import Group from "./Group"

function usePersistState<T>(key: string, defaultValue: T): [T, (newValue: T) => void] {
  const [state, setState] = useState((() => {
    return JSON.parse(localStorage.getItem(key)!)?.v || defaultValue
  })())
  const setter = useCallback((newValue: T) => {
    localStorage.setItem(key, JSON.stringify({ v: newValue }))
    setState(newValue);
  }, [key]);
  return [state, setter]
}

function Input({ label, ...props }: ({ label: string } & ComponentProps<'input'>)) {
  return (
    <div className="flex items-center">
      <div className="flex-shrink-0 pr-2 text-sm font-semibold">{label}</div>
      <input {...props} />
    </div>
  )
}

type TRate = {
  name: string
  items: Array<{ range: number | string, value: number | string }>
}

function totalRange(items: TRate['items']) {
  return items.filter((_, i) => i < items.length - 1).reduce((a, x) => a + +x.range, 0);
}

function RateTables({
  onChange,
  value
}: {
  onChange: (newValue: TRate[]) => void
  value: TRate[]
}) {
  const handleChangeItem = (row: number, index: number, newValue: TRate['items'][number]) => () => {
    onChange(value.map((x, i) => row === i ? {
      ...x,
      items: x.items.map((y, j) => j === index ? newValue : y),
    } : x))
  }
  const handleAddItem = (row: number, newValue: TRate['items'][number]) => () => {
    onChange(value.map((x, i) => row === i ? {
      ...x,
      items: x.items.concat([newValue]),
    } : x))
  }
  const handleRemoveItem = (row: number, index: number) => () => {
    onChange(value.map((x, i) => row === i ? {
      ...x,
      items: x.items.filter((_, j) => j !== index),
    } : x))
  }
  return (
    <div>
      <div className="font-semibold text-sm">Rate Tables</div>
      <div className="flex flex-wrap gap-3">
        {value.map((item, i) => (
          <div key={i} className="w-[320px]">
            <Group label={item.name}>
              <div className="absolute top-0 right-0">
                <div className="flex space-x-2 text-xs translate-y-[-50%] -translate-x-2 bg-white rounded border px-2">
                  <button type="button" onClick={() => {
                    const newName = prompt('Set New Name', item.name);
                    if (!newName) return;
                    onChange(value.map((row, j) => j === i ? { ...row, name: newName } : row))
                  }}>[Rename]</button>
                  <button type="button" onClick={() => {
                    if (!confirm('Are you sure you want to delete?')) return;
                    onChange(value.filter((_, j) => j !== i))
                  }}>[X]</button>
                </div>
              </div>
              <table className="table table-auto w-full text-sm">
                <tbody>
                  {item.items.map((row, j) => {
                    const isLast = j === item.items.length - 1
                    const f1 = (() => {
                      if (j === 0) return 'First';
                      if (isLast) return 'Over';
                      return 'Next';
                    })()
                    return (
                      <tr key={`${i}-${j}`}>
                        <td className="px-3">{f1}</td>
                        <td>
                          {isLast ? (
                            <div className="text-center">{totalRange(item.items)}</div>
                          ) : (
                            <input className="text-center" onChange={(e) => {
                              handleChangeItem(i, j, { ...row, range: e.target.value })()
                            }} value={row.range} />
                          )}
                        </td>
                        <td><input className="text-center" onChange={(e) => {
                          handleChangeItem(i, j, { ...row, value: e.target.value })()
                        }} value={row.value} /></td>
                        <td><button type="button" onClick={handleRemoveItem(i, j)}>[X]</button></td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td colSpan={4}>
                      <button type="button" onClick={handleAddItem(i, {
                        range: 10, value: 0
                      })}>[Add]</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Group>
          </div>
        ))}
        <div>
          <button type="button" onClick={() => {
            const name = prompt('Set Name');
            if (!name) return;
            onChange([...value].concat([{
              name,
              items: [{ range: 10, value: 0 }],
            }]))
          }}>Add</button>
        </div>
      </div>
    </div>
  )
}

type TCharge = {
  name: string
} & ({
  type: 'rate_table'
  rate_table_name: string
  input_name: string
} | {
  type: 'formula'
  formula: string
})

function Charges({
  onChange, value, rateTableOptions
}: {
  onChange: (newValue: TCharge[]) => void
  value: TCharge[]
  rateTableOptions: TRate[]
}) {
  const handleRemoveItem = (index: number) => () => {
    onChange(value.filter((_, j) => j !== index))
  }
  return (
    <div>
      <div className="font-semibold text-sm">Charges</div>
      <div>
        <table className="table w-full table-auto">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th colSpan={2}>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {value.map((item, i) => {
              return (
                <tr key={i}>
                  <td><button type="button" onClick={() => {
                    const name = prompt("Rename Charge", item.name);
                    if (!name) return;
                    onChange(value.map((x, j) => i === j ? {
                      ...x,
                      name,
                    } : x))
                  }}>{item.name}</button></td>
                  <td>
                    <select onChange={(e) => {
                      onChange(value.map((x, j) => i === j ? {
                        ...x,
                        type: e.target.value as any,
                      } : x))
                    }} value={item.type}>
                      <option value="rate_table">rate_table</option>
                      <option value="formula">formula</option>
                    </select>
                  </td>
                  <td>
                    {item.type === 'rate_table' ? (
                      <div className="flex space-x-4">
                        <select className="flex-1" onChange={(e) => {
                          onChange(value.map((x, j) => i === j ? {
                            ...x,
                            rate_table_name: e.target.value
                          } : x))
                        }} value={item.rate_table_name}>
                          <option value="">- select -</option>
                          {rateTableOptions.map((item) => (
                            <option key={item.name} value={item.name}>{item.name}</option>
                          ))}
                        </select>
                        <div className="flex flex-1">
                          <span>Input: </span>
                          <input onChange={(e) => {
                            onChange(value.map((x, j) => i === j ? {
                              ...x,
                              input_name: e.target.value
                            } : x))
                          }} value={item.input_name} placeholder="Input Name" />
                        </div>
                      </div>
                    ) : null}
                    {item.type === 'formula' ? (
                      <div>
                        <textarea className="font-mono tracking-tighter" onChange={(e) => {
                          onChange(value.map((x, j) => i === j ? {
                            ...x,
                            formula: e.target.value
                          } : x))
                        }} value={item.formula} placeholder="Enter Formula (e.g <Consumption> * 10%)" />
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <button type="button" onClick={handleRemoveItem(i)}>[X]</button>
                  </td>
                </tr>
              )
            })}
            <tr>
              <td colSpan={4}>
                <button type="button" onClick={() => {
                  const name = prompt("Enter Charge Name");
                  if (!name) return;
                  onChange(value.concat([{
                    name,
                    type: 'formula',
                    formula: '',
                  }]))
                }}>[Add Charge]</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

const clamp = (v: number, max: number) => {
  if (v >= max) return max;
  return v;
}

function calculateRate(rates: TRate['items'], input: number) {
  const allocated = [];
  let rem = +input;
  // rates.forEach((rate) => {

  // })
  let i = 0;
  const tempRates = [...rates]
  const lastRate = tempRates.pop();
  while (rem > 0) {
    const rate = tempRates[i];
    if (!rate) {
      allocated.push(rem * +(lastRate?.value || 0))
      break;
    }
    allocated.push((() => {
      if (i === 0) {
        return +rate.value
      }
      return clamp(rem, +rate.range) * +rate.value
    })())
    rem -= +rate.range
    i += 1;
  }
  return allocated.reduce((a, x) => a + x, 0);
}

function formatVariables(val: Record<string, number>) {
  const obj: Record<string, number> = {};
  Object.keys(val).map((key) => {
    obj[`<${key}>`] = val[key];
  })
  return obj;
}

function executeFormula(formula: string, variable: Record<string, number>) {
  let temp = `${formula}`;
  Object.keys(variable).forEach((key) => {
    const val = variable[key];
    const regex = new RegExp(key, 'g');
    temp = temp.replace(regex, String(val)) ;
  })
  return (() => {
    try {
      return eval(String(temp))
    } catch (err) {
      console.log('ERR!', temp);
      return '- invalid -'
    }
  })();
}

function parseNumber(n: any): number {
  try {
    return !Number.isNaN(+n) ? +n : 0;
  } catch (err) {
    return 0;
  }
}

function Output({
  consumption,
  dataset,
  rateTables,
  charges
}: {
  consumption: string
  dataset: TDataset[]
  rateTables: TRate[]
  charges: TCharge[]
}) {
  const flatCharges = useMemo(() => {
    const flatConsumption: Record<string, number> = {
      Consumption: +consumption,
    }
    dataset.forEach((set) => {
      flatConsumption[`${set.group}_${set.name}`] = +set.value
    })

    const flat: Record<string, number> = {};
    charges.forEach((charge) => {
      if (charge.type === 'rate_table') {
        const inputValue = +flatConsumption[charge.input_name] || 0;
        const rate = rateTables.find((x) => x.name === charge.rate_table_name);
        flat[charge.name] = calculateRate(rate?.items || [], inputValue);
      }
      if (charge.type === 'formula') {
        flat[charge.name] = executeFormula(charge.formula, formatVariables({
          ...flatConsumption,
          ...flat,
        }));
      }
    })
    return Object.entries(flat);
  }, [charges, consumption, dataset, rateTables]);

  return (
    <div>
      <Group label="Output">
        <table className="table">
          <tbody>
            {flatCharges.map(([label, value]) => (
              <tr key={label}>
                <td className="px-4">{label}</td>
                <td className="text-right px-2">{parseNumber(value).toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td className="text-right px-4">Total</td>
              <td className="text-right font-bold">{flatCharges.reduce((a, x) => a + parseNumber(x[1]), 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </Group>
    </div>
  )
}

type TDataset = {
  name: string
  group: string
  value: string | number
}

function Datasets({
  onChange,
  value,
}: {
  onChange: (newValue: TDataset[]) => void
  value: TDataset[]
}) {
  const grouped = useMemo(() => {
    const temp: Record<string, Array<(TDataset & { index: number })>> = {}
    value.forEach((set, i) => {
      const t = temp[set.group] || [];
      t.push({ ...set, index: i })
      temp[set.group] = t;
    })
    return temp;
  }, [value]);
  return (
    <div>
      <div className="font-semibold text-sm">Dataset</div>
      <div className="flex flex-wrap gap-3">
        {Object.entries(grouped).map(([label, items]) => (
          <div className="w-[250px]" key={label}>
            <Group label={label}>
              <table className="w-full">
                <thead>
                  <tr className="text-xs">
                    <th>
                      Item
                    </th>
                    <th>
                      Value
                    </th>
                    <th>
                      &nbsp;
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <input onChange={(e) => {
                          onChange(value.map((x, j) => j === row.index ? {
                            ...x,
                            name: e.target.value,
                          } : x));
                        }} value={row.name} />
                      </td>
                      <td>
                        <input onChange={(e) => {
                          onChange(value.map((x, j) => j === row.index ? {
                            ...x,
                            value: e.target.value,
                          } : x));
                        }} value={row.value} />
                      </td>
                      <td>
                        <button type="button" onClick={() => {
                          onChange(value.filter((_, j) => j !== row.index));
                        }}>[X]</button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3}>
                      <button type="button" onClick={() => {
                        onChange(value.concat({
                          group: label,
                          name: `Untitled ${items.length + 1}`,
                          value: '',
                        }))
                      }}>[Add]</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Group>
          </div>
        ))}
        <div>
          <button type="button" onClick={() => {
            const group = prompt('Enter Group Name');
            if (!group) return;
            onChange(value.concat({
              group,
              name: `Untitled 1`,
              value: '',
            }))
          }}>[Add Group]</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [consumption, setConsumption] = usePersistState('consumption', '23');
  const [dataset, setDataset] = usePersistState<TDataset[]>('dataset', [
    { group: 'Meter Charge', name: '1/2" or 13mm', value: 1.50 },
    { group: 'Meter Charge', name: '3/4" or 20mm', value: 2.00 },
    { group: 'Meter Charge', name: '1" or 25mm', value: 3.00 },
    { group: 'Meter Charge', name: '1 1/4" or 40mm', value: 4.00 },
    { group: 'Meter Charge', name: '2" or 50mm', value: 6.00 },
    { group: 'Meter Charge', name: '3" or 75mm', value: 10.00 },
  ]);
  const [rateTables, setRateTables] = usePersistState<TRate[]>('rate-tables', []);
  const [charges, setCharges] = usePersistState<TCharge[]>('charges', []);
  return (
    <div>
      <div className="container mx-auto space-y-8">
        <div className="flex gap-4">
          <div className="w-[320px]">
            <Group label="Input Variables" className="space-y-2">
              <Input label="Consumption" onChange={(e) => setConsumption(e.target.value)} value={consumption} />
            </Group>
          </div>
          <div className="flex-1 min-w-0">
            <Datasets onChange={setDataset} value={dataset} />
          </div>
        </div>
        <div>
          <Charges onChange={setCharges} value={charges} rateTableOptions={rateTables} />
        </div>
        <div>
          <Output
            consumption={consumption}
            dataset={dataset}
            rateTables={rateTables}
            charges={charges}
          />
        </div>
        <div>
          <RateTables onChange={setRateTables} value={rateTables} />
        </div>
      </div>
    </div>
  )
}

export default App