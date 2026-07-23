import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

type InvoicePdfProps = {
  schoolName: string;
  schoolAddress: string | null;
  invoiceNumber: string;
  studentName: string;
  admissionNumber: string;
  dueDate: Date;
  cycleDate: Date;
  totalAmount: string;
  paidAmount: string;
  status: string;
  items: { name: string; amount: string }[];
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#172033" },
  header: { marginBottom: 24, borderBottomWidth: 2, borderBottomColor: "#1d4ed8", paddingBottom: 14 },
  school: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#1e3a8a" },
  title: { fontSize: 13, marginTop: 8, color: "#475569" },
  details: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  detailColumn: { width: "48%" },
  label: { color: "#64748b", marginBottom: 3 },
  value: { fontFamily: "Helvetica-Bold", marginBottom: 10 },
  tableHeader: { flexDirection: "row", backgroundColor: "#eff6ff", padding: 8, fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: 8 },
  description: { width: "70%" },
  amount: { width: "30%", textAlign: "right" },
  totals: { marginTop: 18, marginLeft: "50%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  outstanding: { fontFamily: "Helvetica-Bold", color: "#b91c1c", borderTopWidth: 1, borderTopColor: "#94a3b8", paddingTop: 8, marginTop: 4 },
  footer: { marginTop: 34, color: "#64748b", fontSize: 8, textAlign: "center" },
});

const money = (value: string) => `INR ${Number(value).toFixed(2)}`;
const date = (value: Date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(value);

export function InvoicePdf(props: InvoicePdfProps) {
  const outstanding = Number(props.totalAmount) - Number(props.paidAmount);

  return (
    <Document title={props.invoiceNumber} author={props.schoolName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.school}>{props.schoolName}</Text>
          {props.schoolAddress ? <Text>{props.schoolAddress}</Text> : null}
          <Text style={styles.title}>FEE INVOICE</Text>
        </View>
        <View style={styles.details}>
          <View style={styles.detailColumn}>
            <Text style={styles.label}>BILLED TO</Text>
            <Text style={styles.value}>{props.studentName}</Text>
            <Text style={styles.label}>Admission number</Text>
            <Text style={styles.value}>{props.admissionNumber}</Text>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.label}>INVOICE NUMBER</Text>
            <Text style={styles.value}>{props.invoiceNumber}</Text>
            <Text style={styles.label}>DUE DATE</Text>
            <Text style={styles.value}>{date(props.dueDate)}</Text>
            <Text style={styles.label}>STATUS</Text>
            <Text style={styles.value}>{props.status}</Text>
          </View>
        </View>
        <View style={styles.tableHeader}>
          <Text style={styles.description}>Fee component</Text>
          <Text style={styles.amount}>Amount</Text>
        </View>
        {props.items.map((item) => (
          <View key={item.name} style={styles.row}>
            <Text style={styles.description}>{item.name}</Text>
            <Text style={styles.amount}>{money(item.amount)}</Text>
          </View>
        ))}
        <View style={styles.totals}>
          <View style={styles.totalRow}><Text>Total</Text><Text>{money(props.totalAmount)}</Text></View>
          <View style={styles.totalRow}><Text>Paid</Text><Text>{money(props.paidAmount)}</Text></View>
          <View style={[styles.totalRow, styles.outstanding]}><Text>Outstanding</Text><Text>{money(String(outstanding))}</Text></View>
        </View>
        <Text style={styles.footer}>Fee cycle: {date(props.cycleDate)} · This is a computer-generated invoice.</Text>
      </Page>
    </Document>
  );
}
