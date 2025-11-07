import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Installments = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Installment Tracking</h1>
          <p className="text-muted-foreground">
            Monitor and manage customer installment payments
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Installment tracking features will be available soon. You'll be
              able to view all installments, mark payments as received, and
              track overdue payments.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Installments;
