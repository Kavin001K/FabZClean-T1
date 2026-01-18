import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface BulkActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onUpdateStatus: (status: string) => void;
  onExportSelected: () => void;
  onDeleteSelected: () => void;
  isLoading?: boolean;
}

export default React.memo(function BulkActionsDialog({
  isOpen,
  onClose,
  selectedCount,
  onUpdateStatus,
  onExportSelected,
  onDeleteSelected,
  isLoading = false,
}: BulkActionsDialogProps) {
  const { toast } = useToast();

  const handleStatusUpdate = (status: string) => {
    onUpdateStatus(status);
    toast({
      title: "Status Update",
      description: `Updating ${selectedCount} orders to ${status}`,
    });
  };

  const handleExport = () => {
    onExportSelected();
    toast({
      title: "Export Started",
      description: `Exporting ${selectedCount} selected orders...`,
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCount} orders? This action cannot be undone.`)) {
      onDeleteSelected();
      toast({
        title: "Deletion Started",
        description: `Deleting ${selectedCount} selected orders...`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Actions</DialogTitle>
          <DialogDescription>
            Perform actions on {selectedCount} selected orders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              <strong>{selectedCount}</strong> orders selected
            </p>
          </div>

          {/* Status Updates */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Update Status</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('processing')}
                disabled={isLoading}
                className="justify-start gap-2"
              >
                <Clock className="h-4 w-4" />
                Processing
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('completed')}
                disabled={isLoading}
                className="justify-start gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Completed
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={isLoading}
                className="justify-start gap-2"
              >
                <XCircle className="h-4 w-4" />
                Cancelled
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('pending')}
                disabled={isLoading}
                className="justify-start gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Pending
              </Button>
            </div>
          </div>

          {/* Other Actions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Other Actions</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                disabled={isLoading}
                className="justify-start gap-2"
              >
                <Download className="h-4 w-4" />
                Export Selected
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="justify-start gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
