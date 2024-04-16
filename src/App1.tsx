/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Children, useCallback, useMemo, useState } from "react"

type TCharges = {
  name: string
  type: 'fixed' | 'variable' | 'formula'
  value: string
}

const VARIABLES = [
  'consumption',
  'per_unit',
]

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

export const parseNumber = (str: string, defaultValue: boolean | number = false): number => {
  const v = parseFloat(`${str}`.replace(/,/g, ""));
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(v)) return (typeof defaultValue !== "boolean" ? defaultValue : str) as number;
  return v;
};

const useEvaluate = (expression: string) => {
  try {
    return {
      result: eval(String(expression)),
      error: undefined,
    }
  } catch(err) {
    return {
      result: undefined,
      error: 'Invalid Formula!'
    }
  }
}

type TMatrix = {
  name: string
  items: Array<{ next: number, value: number }>
}

function buildMatrixItems(items: Array<TMatrix['items'][number]>) {
  const temp: Array<{ label: string, next: number, value: number }> = [];
  let from = 0;
  items.forEach((item, i) => {
    const isLast = i >= items.length - 1;
    temp.push({
      label: isLast ? `${from} and over` : `${from} ~ ${+from + +item.next}`,
      next: item.next,
      value: item.value
    })
    from += +item.next
  });
  return temp;
}

function App() {
  const [matrix, setMatrix] = usePersistState<Array<TMatrix>>('matrix', []);
  const [formula, setFormula] = usePersistState('formula', '');
  const [variables, setVariables] = usePersistState<Record<string, string>>('variables', {});
  const [charges, setCharges] = usePersistState<Array<TCharges>>('charges', [])
  const changeCharge = (index: number, key: keyof TCharges) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCharges(charges.map((x, i) => i === index ? ({
      ...x,
      [key]: e.target.value
    }) : x))
  }

  const changeMatrixItem = (matrixIndex: number, subIndex: number, key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setMatrix(matrix.map((x, i) => i === matrixIndex ? ({
      ...x,
      items: (x.items || []).map((y, j) => j === subIndex ? ({
        ...y,
        [key]: e.target.value
      }) : y),
    }) : x))
  }

  const flat = useMemo(() => {
    const temp: Record<string, number> = {};
    Object.keys(variables).forEach((key) => {
      temp[`<${key}>`] = parseNumber(variables[key], 0)
    })
    charges.forEach((item) => {
      if (item.type === 'fixed') temp[`<${item.name}>`] = parseNumber(item.value, 0)
    })
  return temp;
  }, [JSON.stringify(variables), JSON.stringify(charges)])


  const values_applied = useMemo(() => {
    let temp = `${formula}`;
    Object.keys(flat).forEach((key) => {
      const val = flat[key];
      const regex = new RegExp(key, 'g');
      temp = temp.replace(regex, String(val)) ;
    })
    return temp;
  }, [JSON.stringify(flat), formula]);

  const { result, error } = useEvaluate(values_applied);

  console.log({
    result,
    error,
  });

  return (
    <div className="container mx-auto">
      <div className="flex flex-wrap justify-center gap-8">

        <div className="w-80">
          <table className="table table-auto  w-full">
            <thead>
              <tr>
                <th colSpan={2}>Variables</th>
              </tr>
            </thead>
            <tbody>
              {VARIABLES.map((item) => (
                <tr key={item}>
                  <td>{item}</td>
                  <td>
                    <input className="w-full text-right" onChange={(e) => {
                      setVariables({ ...variables, [item]: e.target.value})
                    }} value={variables?.[item] || ''} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="w-[500px]">
          <table className="table table-fixed  w-full">
            <thead>
              <tr>
                <th className="w-24">Type</th>
                <th>Charges</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Children.toArray(charges.map((item, i) => (
                <tr>
                  <td>
                    <select className="w-full text-right" onChange={changeCharge(i, 'type')} value={item.type}>
                      <option value="fixed">fixed</option>
                      <option value="variable">variable</option>
                      {/* <option value="formula">formula</option> */}
                    </select>
                  </td>
                  <td>
                    <input className="w-full text-right" onChange={changeCharge(i, 'name')} value={item.name} />
                  </td>
                  <td>
                    <div className="flex">
                      {item.type === 'fixed' && <input className="w-full text-right" onChange={changeCharge(i, 'value')} value={item.value} type="number" />}
                      {item.type === 'variable' && (
                        <select className="w-full text-right" onChange={changeCharge(i, 'value')} value={item.value}>
                          <option value="">- Select -</option>
                          {VARIABLES.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      )}
                      <button className="flex-shrink-0 w-auto px-2" type="button" onClick={() => {
                        // if (!confirm("Remove charge?")) return;
                        setCharges(charges.filter((_, j) => j !== i));
                      }}>X</button>
                    </div>
                  </td>
                </tr>
              )))}
              <tr>
                <td colSpan={3}>
                  <button type="button" onClick={() => {
                    setCharges(charges.concat([{
                      name: `code${charges.length + 1}`, type: 'fixed', value: '',
                    }]))
                  }}>Add Charge</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="w-full">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex justify-center flex-wrap gap-2">
              {Children.toArray(matrix.map((item, i) => (
                <div className="border p-3 w-80">
                  <div>
                    <div className="flex justify-between">
                      <label className="mb-1 text-sm font-semibold">&nbsp;</label>
                      <button className="flex-shrink-0 w-auto px-2" type="button" onClick={() => {
                        // if (!confirm("Remove charge?")) return;
                        setMatrix(matrix.filter((_, j) => j !== i));
                      }}>X</button>
                    </div>
                    <input className="w-full" onChange={(e) => {
                      setMatrix(matrix.map((x, k) => k === i ? ({
                        ...x,
                        name: e.target.value
                      }) : x))
                    }} value={item.name} />
                  </div>
                  <div>
                    <table className="table table-auto w-full">
                      <thead>
                        <tr>
                          <th>Matrix</th>
                          <th>Next</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Children.toArray(buildMatrixItems(item.items).map((sub, j) => (
                          <tr>
                            <td><span className="flex-shrink-0 whitespace-nowrap">{sub.label}</span></td>
                            <td>
                              <input
                                className="w-full"
                                onChange={changeMatrixItem(i, j, 'next')}
                                value={(j >= item.items.length - 1) ? '' : sub.next}
                                disabled={j >= item.items.length - 1}
                              />
                            </td>
                            <td>
                              <div className="flex">
                                <input className="w-full" onChange={changeMatrixItem(i, j, 'value')} value={sub.value} />
                                <button className="flex-shrink-0 w-auto px-2" type="button" onClick={() => {
                                  // if (!confirm("Remove charge?")) return;
                                  setMatrix(matrix.map((x, k) => k === i ? ({
                                    ...x,
                                    items: (x.items || []).filter((_, l) => k !== l)
                                  }) : x))
                                }}>X</button>
                              </div>
                            </td>
                          </tr>
                        )))}
                        <tr>
                          <td colSpan={3}>
                            <button type="button" onClick={() => {
                              setMatrix(matrix.map((x, k) => k === i ? ({
                                ...x,
                                items: (x.items || []).concat([{
                                  next: 10,
                                  value: 0
                                }])
                              }) : x))
                            }}>Add Next</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )))}
              <div className="flex justify-center">
                <button type="button" onClick={() => {
                  setMatrix(matrix.concat([{
                    name: `matrix${matrix.length + 1}`,
                    items: [],
                  }]))
                }}>Add Matrix</button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="border max-w-xl mx-auto p-3">
            <label>Enter Formula</label>
            <textarea className="w-full" onChange={(e) => setFormula(e.target.value)} value={formula} />
            <div className="text-sm">
              Output: <span className="italic font-semibold">{values_applied}</span>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="border max-w-sm mx-auto p-3 text-center">
            <label>Result</label>
            <div className="font-black text-4xl font-mono">
              {error ? (
                <span className="text-danger-600">{error}</span>
              ) : (
                <span>{result}</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
