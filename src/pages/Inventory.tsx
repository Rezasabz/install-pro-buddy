import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Inventory = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">
              Track and manage your phone inventory
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Phone
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Inventory management features will be available soon. You'll be
              able to add phones, track purchases, and manage stock levels.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Inventory;
