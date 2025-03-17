import { useState, useEffect, useMemo, useCallback } from "react"
import { TabMenu } from "primereact/tabmenu"
import { ProgressSpinner } from "primereact/progressspinner"
import type { Paths } from "~/utils/types/openapi.d.ts"
import { formatBalance } from "~/utils"
import client from "~/utils/client"
import styles from "~/App.module.css"
import currency from "currency.js"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
} from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"
import { Bar, Line } from "react-chartjs-2"
import type { BarControllerChartOptions, LineControllerChartOptions } from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  PointElement,
  LineElement,
  Filler
)

function Report() {
  const [salesReport, setSalesReport] = useState<Paths.GetSalesReport.Responses.$200 | null>(null)

  const handleGetSalesReport = useCallback(async () => {
    setSalesReport(null)
    const result = await client.GetSalesReport()
    setSalesReport(result.data)
  }, [])

  useEffect(() => {
    handleGetSalesReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categoriesOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Bilety sprzedane dla kategorii",
        },
        datalabels: {
          display: true,
          anchor: "center",
          align: "center",
          color: "#000",
          backgroundColor: "#ccc7",
          padding: 1,
          borderRadius: 3,
          font: {
            weight: "bold",
            size: 16,
          },
        },
      },
      scales: {
        y: {
          min: 0,
          ticks: {
            stepSize: 100,
          },
        },
      },
    }
  }, [])

  const categoriesData = useMemo(() => {
    if (salesReport) {
      const ticketCounts = salesReport.ticketCountByCategory.filter(
        (ticketCount) => ticketCount.idCategory !== null
      )
      const labels = ticketCounts.map((ticketCount) => ticketCount.categoryName)
      const datasets = [
        {
          label: "Liczba sprzedanych biletów",
          data: ticketCounts.map((ticketCount) => ticketCount.ticketCount),
          backgroundColor: "#007afc",
        },
      ]
      return {
        labels,
        datasets,
      }
    } else {
      return null
    }
  }, [salesReport])

  const categoriesTicketCountSummary = useMemo(() => {
    if (salesReport) {
      return (
        salesReport.ticketCountByCategory.find(
          (ticketCount) => ticketCount.idCategory === null
        ) ?? { ticketCount: 0 }
      )
    } else {
      return null
    }
  }, [salesReport])

  const [reportMode, setReportMode] = useState<"dailyIncome" | "monthlyIncome" | "annualIncome">(
    "dailyIncome"
  )
  const reportModeItems = [
    {
      label: "Dziennie",
      command: () => {
        setReportMode("dailyIncome")
      },
    },
    {
      label: "Miesięcznie",
      command: () => {
        setReportMode("monthlyIncome")
      },
    },
    {
      label: "Rocznie",
      command: () => {
        setReportMode("annualIncome")
      },
    },
  ]

  const incomeOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: true,
      borderJoinStyle: "round",
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Przychód dla daty",
        },
        datalabels: {
          display: false,
          anchor: "center",
          align: "center",
          color: "#000",
          backgroundColor: "#ccc7",
          padding: 1,
          borderRadius: 3,
          font: {
            weight: "bold",
            size: 16,
          },
        },
      },
      scales: {
        y: {
          min: 0,
          title: {
            display: true,
            text: "Przychód",
            font: {
              weight: "bold",
            },
          },
          ticks: {
            stepSize: 1,
          },
        },
        x: {
          title: {
            display: true,
            text: "Data",
            font: {
              weight: "bold",
            },
          },
        },
      },
    }
  }, [])

  const incomeData = useMemo(() => {
    if (salesReport) {
      const labels = Array.from(new Set(salesReport[reportMode].map((income) => income.date)))
      const incomes: any = {}
      for (const income of salesReport[reportMode]) {
        if (!(income.date in incomes)) {
          incomes[income.date] = currency(0)
        }
        incomes[income.date] = incomes[income.date].add(currency(income.income))
      }
      const datasets = [
        {
          label: "Wartość przychodu",
          data: Object.values(incomes).map((income) =>
            formatBalance((income as currency).toString())
          ),
          backgroundColor: "#007afc",
        },
      ]

      return {
        labels,
        datasets,
      }
    } else {
      return null
    }
  }, [salesReport, reportMode])

  const incomeSummary = useMemo(() => {
    if (salesReport) {
      return salesReport[reportMode]
        .reduce(
          (previousValue, currentValue) => previousValue.add(currency(currentValue.income)),
          currency(0)
        )
        .toString()
    } else {
      return null
    }
  }, [salesReport, reportMode])

  const ticketCountOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Bilety sprzedane dla daty",
        },
        datalabels: {
          display: true,
          anchor: "center",
          align: "center",
          color: "#000",
          backgroundColor: "#ccc7",
          padding: 1,
          borderRadius: 3,
          font: {
            weight: "bold",
            size: 16,
          },
        },
      },
      scales: {
        y: {
          min: 0,
          title: {
            display: true,
            text: "Sprzedane bilety",
            font: {
              weight: "bold",
            },
          },
          ticks: {
            stepSize: 100,
          },
        },
        x: {
          title: {
            display: true,
            text: "Data",
            font: {
              weight: "bold",
            },
          },
        },
      },
    }
  }, [])

  const ticketCountData = useMemo(() => {
    if (salesReport) {
      const labels = Array.from(new Set(salesReport[reportMode].map((income) => income.date)))
      const soldTickets: any = {}
      for (const income of salesReport[reportMode]) {
        if (!(income.date in soldTickets)) {
          soldTickets[income.date] = 0
        }
        soldTickets[income.date] += income.ticketCount
      }
      const datasets = [
        {
          label: "Liczba sprzedanych biletów",
          data: Object.values(soldTickets),
          backgroundColor: "#007afc",
        },
      ]

      return {
        labels,
        datasets,
      }
    } else {
      return null
    }
  }, [salesReport, reportMode])

  const ticketCountSummary = useMemo(() => {
    if (salesReport) {
      return salesReport[reportMode].reduce(
        (previousValue, currentValue) => previousValue + currentValue.ticketCount,
        0
      )
    } else {
      return null
    }
  }, [salesReport, reportMode])

  return (
    <>
      <h2 className="mt-0">Raport</h2>
      {salesReport ? (
        <>
          <TabMenu model={reportModeItems} />
          <div className="grid">
            <div className="col-12 xl:col-6">
              <h3 className="text-center">Przychód</h3>
              <p className="text-center">
                <small>
                  {reportMode === "dailyIncome" &&
                    "Dzienny przychód za każdy dzień do 30 dni wstesz"}
                </small>
                <small>
                  {reportMode === "monthlyIncome" &&
                    "Miesięczny przychód za każdy miesiąc do 12 miesięcy wstecz"}
                </small>
                <small>
                  {reportMode === "annualIncome" && "Roczny przychód za każdy rok do 5 lat wstecz"}
                </small>
              </p>
              <div className={styles.chartContainer}>
                <Line
                  options={incomeOptions as unknown as LineControllerChartOptions}
                  data={incomeData!}
                />
              </div>
              <p className="text-center text-xl font-bold	">
                Podsumowanie: {formatBalance(incomeSummary!)} ETH
              </p>
            </div>
            <div className="col-12 xl:col-6">
              <h3 className="text-center">Sprzedane bilety</h3>
              <p className="text-center">
                <small>
                  {reportMode === "dailyIncome" &&
                    "Sprzedane bilety za każdy dzień do 30 dni wstecz"}
                </small>
                <small>
                  {reportMode === "monthlyIncome" &&
                    "Sprzedane bilety za każdy miesiąc do 12 miesięcy wstecz"}
                </small>
                <small>
                  {reportMode === "annualIncome" && "Sprzedane bilety za każdy rok do 5 lat wstecz"}
                </small>
              </p>
              <div className={styles.chartContainer}>
                <Bar
                  options={ticketCountOptions as unknown as BarControllerChartOptions}
                  data={ticketCountData!}
                />
              </div>
              <p className="text-center text-xl font-bold	">Podsumowanie: {ticketCountSummary}</p>
            </div>
            <div className="col-12">
              <hr className="my-5" />
              <h3 className="text-center">Sprzedaż według kategorii</h3>
              <p className="text-center">
                <small>Liczba sprzedanych biletów według kategorii</small>
              </p>
              <div className={styles.chartContainer}>
                <Bar
                  options={categoriesOptions as unknown as BarControllerChartOptions}
                  data={categoriesData!}
                />
              </div>
              <p className="text-center text-xl font-bold	">
                Podsumowanie: {categoriesTicketCountSummary!.ticketCount}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-content-center align-items-center">
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
        </div>
      )}
    </>
  )
}

export default Report
