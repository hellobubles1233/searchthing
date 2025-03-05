import { BangItem } from "../types/BangItem";

/**
 * Interface for messages sent to the worker
 */
export interface WorkerMessage {
  type: string;
  query?: string;
  customBangs?: BangItem[];
}

/**
 * Interface for messages received from the worker
 */
export interface WorkerResponse {
  type: string;
  results?: BangItem[];
  query?: string;
  error?: string;
}

/**
 * Utility class for managing the bang worker
 */
export class BangWorkerManager {
  private worker: Worker | null = null;
  private callbacks: Map<string, (results: BangItem[]) => void> = new Map();
  private errorHandler: ((error: string) => void) | null = null;
  
  /**
   * Initialize the worker
   */
  public init(): void {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      console.error('Web Workers are not supported in this environment');
      return;
    }
    
    try {
      // Create the worker
      this.worker = new Worker(new URL('../workers/bang-worker.ts', import.meta.url), { type: 'module' });
      
      // Set up message handler
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { type, results, query, error } = e.data;
        
        if (type === 'FILTER_RESULTS' && results && query) {
          // Call the callback for this query
          const callback = this.callbacks.get(query);
          if (callback) {
            callback(results);
            this.callbacks.delete(query);
          }
        } else if (type === 'ERROR' && error) {
          console.error('Bang worker error:', error);
          if (this.errorHandler) {
            this.errorHandler(error);
          }
        }
      };
      
      // Set up error handler
      this.worker.onerror = (e: ErrorEvent) => {
        console.error('Bang worker error:', e.message);
        if (this.errorHandler) {
          this.errorHandler(e.message);
        }
      };
    } catch (error) {
      console.error('Failed to initialize bang worker:', error);
    }
  }
  
  /**
   * Filter bangs using the worker
   * @param query The search query
   * @param customBangs Custom bangs to include
   * @param callback Callback function to receive results
   */
  public filterBangs(
    query: string,
    customBangs: BangItem[] = [],
    callback: (results: BangItem[]) => void
  ): void {
    if (!this.worker) {
      console.warn('Worker not initialized, initializing now...');
      this.init();
      
      // If initialization failed, return
      if (!this.worker) {
        console.error('Failed to initialize worker');
        return;
      }
    }
    
    // Store the callback
    this.callbacks.set(query, callback);
    
    // Send the request to the worker
    this.worker.postMessage({
      type: 'FILTER_BANGS',
      query,
      customBangs
    });
  }
  
  /**
   * Clear the worker's cache
   */
  public clearCache(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'CLEAR_CACHE' });
    }
  }
  
  /**
   * Set an error handler
   * @param handler The error handler function
   */
  public setErrorHandler(handler: (error: string) => void): void {
    this.errorHandler = handler;
  }
  
  /**
   * Terminate the worker
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Create a singleton instance
export const bangWorker = new BangWorkerManager(); 