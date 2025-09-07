import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface RenameModalProps {
    open: boolean;
    onClose: () => void;
    defaultValue?: string;
    onSave: (name: string) => void;
}

export default function RenameModal({
    open,
    onClose,
    defaultValue = "",
    onSave,
}: RenameModalProps) {
    const [name, setName] = useState(defaultValue);

    useEffect(() => {
        setName(defaultValue);
    }, [defaultValue]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onSave(name);
                        if (e.key === "Escape") onClose();
                    }}
                    autoFocus
                />
                <DialogFooter className="flex gap-2 justify-end mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={() => onSave(name)}
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
