const Button = ({ children, ...props }) => {
  return (
    <button
      className="drop-shadow-lg m-2 inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700  active:drop-shadow-none focus:outline-none"
      {...props}
    >
      {children}
    </button>
  );
};

export const LinkButton = ({ children, ...props }) => {
  return (
    <a
      className={`drop-shadow-lg m-2 inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700  active:drop-shadow-none focus:outline-none`}
      {...props}
    >
      {children}
    </a>
  );
};

export default Button;
