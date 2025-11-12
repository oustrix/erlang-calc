export namespace erlang {
	
	export class MetricsRequest {
	    offeredLoad: number;
	    servers: number;
	
	    static createFrom(source: any = {}) {
	        return new MetricsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.offeredLoad = source["offeredLoad"];
	        this.servers = source["servers"];
	    }
	}
	export class MetricsResponse {
	    offeredLoad: number;
	    servers: number;
	    utilization: number;
	    blockingProbability: number;
	    waitingProbability: number;
	    trafficCarried: number;
	    effectiveUtilization: number;
	
	    static createFrom(source: any = {}) {
	        return new MetricsResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.offeredLoad = source["offeredLoad"];
	        this.servers = source["servers"];
	        this.utilization = source["utilization"];
	        this.blockingProbability = source["blockingProbability"];
	        this.waitingProbability = source["waitingProbability"];
	        this.trafficCarried = source["trafficCarried"];
	        this.effectiveUtilization = source["effectiveUtilization"];
	    }
	}

}

