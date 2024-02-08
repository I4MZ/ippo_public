const MylibraryModal = ({ onClose }) => {
  return (
    <div className="flex flex-row items-start justify-start relative gap-[151px] max-w-full max-h-full overflow-auto text-left text-31xl text-black font-jua">
      <div className="relative rounded-31xl bg-gold w-[300px] h-[100px] z-[0]" />
      <div className="relative rounded-31xl bg-gold w-[300px] h-[100px] z-[1]" />
      <div className="absolute my-0 mx-[!important] top-[31px] left-[517px] inline-block w-[167px] h-[50px] shrink-0 z-[2]">
        삭제하기
      </div>
      <div className="absolute my-0 mx-[!important] top-[31px] left-[66px] inline-block w-[167px] h-[50px] shrink-0 z-[3]">
        불러오기
      </div>
    </div>
  );
};

export default MylibraryModal;
