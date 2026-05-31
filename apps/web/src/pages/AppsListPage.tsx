import { AddAppForm } from "../components/AddAppForm";
import { AppsList } from "../components/AppsList";

export const AppsListPage = () => (
  <div className="space-y-6">
    <AddAppForm />
    <AppsList />
  </div>
);
