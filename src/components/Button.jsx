export default ({ content, Icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`drop-shadow-lg m-2 inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700  active:drop-shadow-none focus:outline-none`}
    >
      <Icon className="h-6 w-6 mr-3" /> {content}
    </button>
  );
};
