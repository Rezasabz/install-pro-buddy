import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Sales = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales Management</h1>
            <p className="text-muted-foreground">
              Record and track installment sales
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Sales management features will be available soon. You'll be able
              to create new sales, set installment plans, and track payments.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Sales;
