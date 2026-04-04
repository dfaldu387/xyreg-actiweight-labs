import { DatePicker, TimePicker } from '@svar-ui/react-core';
import './DateTimePicker.css';

export default function DateTimePicker(props) {
  const { value, time, format, onchange, onChange, ...restProps } = props;
  const onChangeHandler = onChange ?? onchange;

  function handleDateChange(ev) {
    const current = new Date(ev.value);
    current.setHours(value.getHours());
    current.setMinutes(value.getMinutes());

    onChangeHandler && onChangeHandler({ value: current });
  }

  return (
    <div className="wx-hFsbgDln date-time-controll">
      <DatePicker
        {...restProps}
        value={value}
        onChange={handleDateChange}
        format={format}
        buttons={['today']}
        clear={false}
      />
      {time ? (
        <TimePicker value={value} onChange={onChangeHandler} format={format} />
      ) : null}
    </div>
  );
}
