import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Event emitter for auction-related events
export type AuctionEventType = 'bid_placed' | 'auction_ended' | 'auction_started';

export interface AuctionEvent {
  type: AuctionEventType;
  auctionId: number;
  data: any;
}

// Simple event emitter
class AuctionEventEmitter {
  private listeners: { [key: string]: ((event: AuctionEvent) => void)[] } = {};

  addEventListener(type: AuctionEventType, callback: (event: AuctionEvent) => void): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  removeEventListener(type: AuctionEventType, callback: (event: AuctionEvent) => void): void {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter(listener => listener !== callback);
  }

  emit(event: AuctionEvent): void {
    if (!this.listeners[event.type]) return;
    this.listeners[event.type].forEach(listener => listener(event));
  }
}

// Create a global instance
export const auctionEvents = new AuctionEventEmitter();
