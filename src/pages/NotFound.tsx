import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <h1 className="text-4xl font-bold">۴۰۴</h1>
          <p className="text-xl text-muted-foreground text-center">
            صفحه مورد نظر یافت نشد
          </p>
          <Link to="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              بازگشت به داشبورد
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
