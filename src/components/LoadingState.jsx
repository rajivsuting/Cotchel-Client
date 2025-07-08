import React from "react";

const LoadingState = ({
  type = "list",
  count = 3,
  className = "",
  itemClassName = "",
}) => {
  const renderListItem = () => (
    <div className={`p-4 sm:p-6 ${itemClassName}`}>
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  const renderCardItem = () => (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden ${itemClassName}`}
    >
      <div className="aspect-w-1 aspect-h-1">
        <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
      </div>
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  const renderTableItem = () => (
    <div className={`p-4 border-b border-gray-100 ${itemClassName}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case "card":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
              <React.Fragment key={index}>{renderCardItem()}</React.Fragment>
            ))}
          </div>
        );
      case "table":
        return (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {Array.from({ length: count }).map((_, index) => (
              <React.Fragment key={index}>{renderTableItem()}</React.Fragment>
            ))}
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {Array.from({ length: count }).map((_, index) => (
              <React.Fragment key={index}>{renderListItem()}</React.Fragment>
            ))}
          </div>
        );
    }
  };

  return <div className={className}>{renderContent()}</div>;
};

export default LoadingState;
