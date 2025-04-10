export function BatchInfo() {
  return (
    <div className="space-y-6 pt-2">
      <div>
        <div className="text-[10px] uppercase text-gray-400 leading-tight text-left">
          SHIFT QUANTITY
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <div>
            <span className="text-5xl font-bold tabular-nums">313</span>
            <span className="text-gray-400 text-lg">/ 1471.81 pcs</span>
          </div>
          <div className="text-right">
            <span className="text-gray-400 text-lg ">OEE(60%)</span>
            <span className="text-right text-5xl font-bold tabular-nums">
              21%
            </span>
          </div>
        </div>
      </div>
      <div>
        <div className="text-[20px] uppercase text-gray-400 leading-tight text-left">
          CURRENT BATCH
          <hr className="w-[150px] border-green-500 border" />
        </div>
        <div className="text-xl text-left leading-tight">HVY87AA</div>
      </div>

      <div className="grid grid-flow-col ">
        <div className="col-span-4 bg-orange-200" style={{ height: "" }}></div>
        <div
          className="col-span-1 bg-orange-600 text-sm"
          style={{ height: "" }}
        >
          {" "}
          759 491 / 0 pcs
        </div>
      </div>

      <div className="grid grid-flow-row space-y-2">
        <div className="text-sm text-left">Previous
          <hr style={{width:'55px'}}></hr>
        </div>
        <div className="text-sm bg-orange-600 text-left" style={{height: "12px;"}}></div>
        <div className="flex justify-between text-sm">
          <div className="text-xl text-left leading-tight">HVY87AA</div>
          <div className="text-yellow-500 tabular-nums">
            759 491 (635) / 0 pcs
          </div>
        </div>
        {/* <div className="flex justify-between text-sm">
          <div className="tabular-nums">337 034 (1)</div>
          <div className="tabular-nums">/ 0 pcs</div>
        </div> */}
      </div>
    </div>
  );
}
