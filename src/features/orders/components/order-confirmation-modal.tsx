"use client";

import { CheckCircle, Loader2, X } from "lucide-react";
import {
  ColorIndicator,
  CutIcon,
  GemstoneTypeIcon,
} from "@/shared/components/ui/gemstone-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import type { CartItem } from "@/shared/types";
import { Separator } from "@/shared/components/ui/separator";
import { useGemstoneTranslations } from "@/features/gemstones/utils/gemstone-translations";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/features/currency/hooks/use-currency";

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: CartItem[];
  onConfirmOrder: () => Promise<void>;
  isProcessing: boolean;
  orderResult?: {
    success: boolean;
    order?: {
      id: string;
      status: string;
      total_amount: number;
      currency_code: string;
      created_at: string;
      items: Array<{
        gemstone_id: string;
        quantity: number;
        unit_price: number;
        line_total: number;
      }>;
      payment: {
        reference: string;
        processed_at: string;
        simulated: boolean;
      };
    };
    error?: string;
  };
}

export function OrderConfirmationModal({
  isOpen,
  onClose,
  selectedItems,
  onConfirmOrder,
  isProcessing,
  orderResult,
}: OrderConfirmationModalProps) {
  const t = useTranslations("cart");
  const tOrders = useTranslations("orders");
  const { translateColor, translateCut, translateGemstoneType } =
    useGemstoneTranslations();

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.line_total.amount,
    0
  );
  const totalItems = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Use currency context for price formatting
  const { formatPrice, convertPrice } = useCurrency();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {orderResult?.success ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                {tOrders("confirmation.successTitle")}
              </>
            ) : (
              tOrders("confirmation.title")
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          {!orderResult?.success && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-3">
                  {tOrders("confirmation.orderSummary")}
                </h3>

                <div className="space-y-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start text-sm space-y-2"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Gemstone Type with Icon */}
                        <div className="flex items-center space-x-2">
                          <GemstoneTypeIcon className="w-3 h-3 text-primary" />
                          <div className="font-medium truncate">
                            {translateGemstoneType(item.gemstone?.name || "")}
                          </div>
                        </div>

                        {/* Color with Icon */}
                        <div className="flex items-center space-x-2">
                          <ColorIndicator
                            color={item.gemstone?.color || ""}
                            className="w-2 h-2"
                          />
                          <span className="text-muted-foreground text-xs">
                            {translateColor(item.gemstone?.color || "")}
                          </span>
                        </div>

                        {/* Cut with Icon and Weight */}
                        <div className="flex items-center space-x-2">
                          <CutIcon
                            cut={item.gemstone?.cut || ""}
                            className="w-3 h-3"
                          />
                          <span className="text-muted-foreground text-xs">
                            {translateCut(item.gemstone?.cut || "")} •{" "}
                            {item.gemstone?.weight_carats}ct
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-medium">
                          {formatPrice(convertPrice(item.line_total.amount, "USD"))}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {item.quantity} ×{" "}
                          {formatPrice(convertPrice(item.unit_price.amount, "USD"))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-3" />

                <div className="flex justify-between items-center font-medium">
                  <span>{tOrders("confirmation.total")}</span>
                  <span className="text-lg">{formatPrice(convertPrice(totalAmount, "USD"))}</span>
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                  <span>{tOrders("confirmation.items")}</span>
                  <span>{totalItems}</span>
                </div>
              </div>

              {/* Payment Notice */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {tOrders("confirmation.simulatedPayment")}
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {tOrders("confirmation.simulatedPaymentDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {orderResult?.success && orderResult.order && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      {tOrders("confirmation.orderPlaced")}
                    </h4>
                    <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                      <div className="flex justify-between">
                        <span>{tOrders("confirmation.orderId")}:</span>
                        <Badge variant="outline" className="font-mono">
                          {orderResult.order.id.slice(0, 8)}...
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>{tOrders("confirmation.totalPaid")}:</span>
                        <span className="font-medium">
                          {formatPrice(convertPrice(orderResult.order.total_amount, "USD"))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{tOrders("confirmation.paymentRef")}:</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {orderResult.order.payment.reference}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  {tOrders("confirmation.nextSteps")}
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• {tOrders("confirmation.nextSteps1")}</li>
                  <li>• {tOrders("confirmation.nextSteps2")}</li>
                  <li>• {tOrders("confirmation.nextSteps3")}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Error State */}
          {orderResult && !orderResult.success && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                    {tOrders("confirmation.errorTitle")}
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {orderResult.error || tOrders("confirmation.errorGeneric")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {!orderResult?.success && !isProcessing && (
              <>
                <Button variant="outline" onClick={onClose} className="flex-1">
                  {t("actions.cancel")}
                </Button>
                <Button
                  onClick={onConfirmOrder}
                  disabled={selectedItems.length === 0}
                  className="flex-1"
                >
                  {tOrders("confirmation.confirmOrder")}
                </Button>
              </>
            )}

            {isProcessing && (
              <Button disabled className="w-full">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {tOrders("confirmation.processing")}
              </Button>
            )}

            {orderResult?.success && (
              <Button onClick={onClose} className="w-full">
                {tOrders("confirmation.viewOrder")}
              </Button>
            )}

            {orderResult && !orderResult.success && !isProcessing && (
              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  {t("actions.close")}
                </Button>
                <Button onClick={onConfirmOrder} className="flex-1">
                  {tOrders("confirmation.tryAgain")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
