import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

type ReceiptPdfProps = {
  schoolName: string;
  schoolAddress: string | null;
  receiptNumber: string;
  invoiceNumber: string;
  studentName: string;
  admissionNumber: string;
  paymentDate: Date;
  amount: string;
  method: string;
  referenceNumber?: string | null;
  collectedBy?: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#172033" },
  header: { marginBottom: 24, borderBottomWidth: 2, borderBottomColor: "#059669", paddingBottom: 14 },
  school: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#065f46" },
  title: { fontSize: 13, marginTop: 8, color: "#475569" },
  details: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  detailColumn: { width: "48%" },
  label: { color: "#64748b", marginBottom: 3 },
  value: { fontFamily: "Helvetica-Bold", marginBottom: 10 },
  amountSection: { backgroundColor: "#ecfdf5", padding: 16, marginTop: 12, borderRadius: 4 },
  amountLabel: { fontSize: 12, color: "#065f46", marginBottom: 4 },
  amountValue: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#047857" },
  footer: { marginTop: 40, color: "#64748b", fontSize: 8, textAlign: "center" },
});

const money = (value: string) => `INR ${Number(value).toFixed(2)}`;
const date = (value: Date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(value);

export function ReceiptPdf(props: ReceiptPdfProps) {
  return (
    <Document title={props.receiptNumber} author={props.schoolName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.school}>{props.schoolName}</Text>
          {props.schoolAddress ? <Text>{props.schoolAddress}</Text> : null}
          <Text style={styles.title}>PAYMENT RECEIPT</Text>
        </View>
        <View style={styles.details}>
          <View style={styles.detailColumn}>
            <Text style={styles.label}>RECEIVED FROM</Text>
            <Text style={styles.value}>{props.studentName}</Text>
            <Text style={styles.label}>Admission Number</Text>
            <Text style={styles.value}>{props.admissionNumber}</Text>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{props.method}</Text>
            {props.referenceNumber && (
              <>
                <Text style={styles.label}>Reference Number</Text>
                <Text style={styles.value}>{props.referenceNumber}</Text>
              </>
            )}
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.label}>RECEIPT NUMBER</Text>
            <Text style={styles.value}>{props.receiptNumber}</Text>
            <Text style={styles.label}>PAYMENT DATE</Text>
            <Text style={styles.value}>{date(props.paymentDate)}</Text>
            <Text style={styles.label}>FOR INVOICE</Text>
            <Text style={styles.value}>{props.invoiceNumber}</Text>
            {props.collectedBy && (
              <>
                <Text style={styles.label}>Collected By</Text>
                <Text style={styles.value}>{props.collectedBy}</Text>
              </>
            )}
          </View>
        </View>
        
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>AMOUNT RECEIVED</Text>
          <Text style={styles.amountValue}>{money(props.amount)}</Text>
        </View>

        <Text style={styles.footer}>This is a computer-generated receipt. No signature is required.</Text>
      </Page>
    </Document>
  );
}
