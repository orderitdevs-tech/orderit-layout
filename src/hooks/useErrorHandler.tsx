import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, RotateCw, AlertCircle } from "lucide-react";
import { useRestaurant } from "@/context/RestaurantContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function useErrorHandler() {
  const { state, clearError, retryLastOperation } = useRestaurant();

  const ErrorDisplay = React.useMemo(() => {
    if (!state.error) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-4 right-4 z-50 max-w-md w-full"
        >
          <Alert variant="destructive" className="bg-white border-orange-200 shadow-lg rounded-xl">
            <div className="flex items-start gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="flex-shrink-0 mt-0.5"
              >
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </motion.div>

              <div className="flex-1">
                <AlertTitle className="text-orange-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Operation Failed
                </AlertTitle>
                <AlertDescription className="text-orange-700 mt-1">
                  {state.error}
                </AlertDescription>

                <div className="flex gap-2 mt-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={retryLastOperation}
                      disabled={state.isLoadingFloor || state.isSaving}
                      className="bg-orange-600 hover:bg-orange-700 text-white h-8 px-3 text-xs"
                      size="sm"
                    >
                      {state.isLoadingFloor || state.isSaving ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="flex items-center gap-1"
                        >
                          <RotateCw className="h-3 w-3 mr-1" />
                          Retrying...
                        </motion.div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <RotateCw className="h-3 w-3 mr-1" />
                          Retry
                        </div>
                      )}
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={clearError}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 h-8 px-3 text-xs"
                      size="sm"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Dismiss
                    </Button>
                  </motion.div>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={clearError}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </Alert>
        </motion.div>
      </AnimatePresence>
    );
  }, [state.error, state.isLoadingFloor, state.isSaving, clearError, retryLastOperation]);

  return {
    error: state.error,
    hasError: !!state.error,
    clearError,
    retryLastOperation,
    ErrorDisplay,
  };
}