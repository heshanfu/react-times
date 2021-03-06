import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import OutsideClickHandler from './OutsideClickHandler';
import MaterialTheme from './MaterialTheme';
import ClassicTheme from './ClassicTheme';
import Button from './Common/Button';
import timeHelper from '../utils/time.js';
import languageHelper from '../utils/language';
import ICONS from '../utils/icons';
import { is } from '../utils/func';

// aliases for defaultProps readability
const TIME = timeHelper.time({ useTz: false });
TIME.current = timeHelper.current();

const propTypes = {
  autoMode: PropTypes.bool,
  colorPalette: PropTypes.string,
  draggable: PropTypes.bool,
  focused: PropTypes.bool,
  language: PropTypes.string,
  meridiem: PropTypes.string,
  onFocusChange: PropTypes.func,
  onTimeChange: PropTypes.func,
  onTimezoneChange: PropTypes.func,
  phrases: PropTypes.object,
  placeholder: PropTypes.string,
  showTimezone: PropTypes.bool,
  theme: PropTypes.string,
  time: PropTypes.string,
  timeMode: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  timezone: PropTypes.string,
  timezoneIsEditable: PropTypes.bool,
  trigger: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.object,
    PropTypes.element,
    PropTypes.array,
    PropTypes.node,
    PropTypes.instanceOf(React.Component),
    PropTypes.instanceOf(React.PureComponent)
  ]),
  withoutIcon: PropTypes.bool,
  minuteStep: PropTypes.number,
  limitDrag: PropTypes.bool,
  timeFormat: PropTypes.string,
  timeFormatter: PropTypes.func,
  useTz: PropTypes.bool,
  closeOnOutsideClick: PropTypes.bool,
};

const defaultProps = {
  autoMode: true,
  colorPalette: 'light',
  draggable: true,
  focused: false,
  language: 'en',
  meridiem: TIME.meridiem,
  onFocusChange: () => {},
  onTimeChange: () => {},
  onTimezoneChange: () => {},
  placeholder: '',
  showTimezone: false,
  theme: 'material',
  time: '',
  timeMode: TIME.mode,
  trigger: null,
  withoutIcon: false,
  minuteStep: 5,
  limitDrag: false,
  timeFormat: '',
  timeFormatter: null,
  useTz: true,
  closeOnOutsideClick: true,
};

class TimePicker extends React.PureComponent {
  constructor(props) {
    super(props);
    const { focused, timezone, onTimezoneChange } = props;
    const timeData = this.timeData(false);
    const timezoneData = timeHelper.tzForName(timeData.timezone);

    this.state = {
      focused,
      timezoneData,
      timeChanged: false
    };

    this.onFocus = this.onFocus.bind(this);
    this.timeData = this.timeData.bind(this);
    this.onClearFocus = this.onClearFocus.bind(this);
    this.handleTimeChange = this.handleTimeChange.bind(this);
    this.handleHourChange = this.handleHourChange.bind(this);
    this.handleMinuteChange = this.handleMinuteChange.bind(this);
    this.handleMeridiemChange = this.handleMeridiemChange.bind(this);
    this.handleHourAndMinuteChange = this.handleHourAndMinuteChange.bind(this);

    // if a timezone value was not passed in,
    // call the callback with the default value used for timezone
    if (!timezone) {
      onTimezoneChange(timezoneData);
    }
  }

  componentWillReceiveProps(nextProps) {
    const { focused } = nextProps;
    if (focused !== this.state.focused) {
      this.setState({ focused });
    }
  }

  onFocus() {
    this.setState({
      focused: true
    });
    const { onFocusChange } = this.props;
    onFocusChange && onFocusChange(true);
  }

  timeData(timeChanged) {
    const {
      time,
      useTz,
      timeMode,
      timezone,
      meridiem,
    } = this.props;
    const timeData = timeHelper.time({
      time,
      meridiem,
      timeMode,
      tz: timezone,
      useTz: !time && !timeChanged && useTz
    });
    return timeData;
  }

  get languageData() {
    const { language, phrases = {} } = this.props;
    return Object.assign({}, languageHelper.get(language), phrases);
  }

  get hourAndMinute() {
    const { timeMode } = this.props;
    const timeData = this.timeData(this.state.timeChanged);
    // Since someone might pass a time in 24h format, etc., we need to get it from
    // timeData to 'translate' it into the local format, including its accurate meridiem
    const hour = (parseInt(timeMode, 10) === 12)
      ? timeData.hour12
      : timeData.hour24;
    const minute = timeData.minute;
    return [hour, minute];
  }

  get formattedTime() {
    const {
      timeMode,
      timeFormat,
      timeFormatter,
    } = this.props;

    const [hour, minute] = this.hourAndMinute;
    const validTimeMode = timeHelper.validateTimeMode(timeMode);

    let times = '';
    if (timeFormatter && is.func(timeFormatter)) {
      times = timeFormatter({
        hour,
        minute,
        meridiem: this.meridiem
      });
    } else if (timeFormat && is.string(timeFormat)) {
      times = timeFormat;
      if (/HH?/.test(times) || /MM?/.test(times)) {
        if (validTimeMode === 12) {
          console.warn('It seems you are using 12 hours mode with 24 hours time format. Please check your timeMode and timeFormat props');
        }
      } else if (/hh?/.test(times) || /mm?/.test(times)) {
        if (validTimeMode === 24) {
          console.warn('It seems you are using 24 hours mode with 12 hours time format. Please check your timeMode and timeFormat props');
        }
      }
      times = times.replace(/(HH|hh)/g, hour);
      times = times.replace(/(MM|mm)/g, minute);
      times = times.replace(/(H|h)/g, Number(hour));
      times = times.replace(/(M|m)/g, Number(minute));
    } else {
      times = (validTimeMode === 12)
        ? `${hour} : ${minute} ${this.meridiem}`
        : `${hour} : ${minute}`;
    }
    return times;
  }

  get meridiem() {
    const { meridiem } = this.props;
    const timeData = this.timeData(this.state.timeChanged);
    const localMessages = this.languageData;
    // eslint-disable-next-line no-unneeded-ternary
    const m = (meridiem) ? meridiem : timeData.meridiem;
    // eslint-disable-next-line no-extra-boolean-cast
    return m && !!(m.match(/^am|pm/i)) ? localMessages[m.toLowerCase()] : m;
  }

  onClearFocus() {
    this.setState({ focused: false });
    const { onFocusChange } = this.props;
    onFocusChange && onFocusChange(false);
  }

  onTimeChanged(timeChanged) {
    this.setState({ timeChanged });
  }

  handleHourChange(hour) {
    const validateHour = timeHelper.validate(hour);
    const minute = this.hourAndMinute[1];
    this.handleTimeChange({
      hour: validateHour,
      minute,
      meridiem: this.meridiem
    });
  }

  handleMinuteChange(minute) {
    const validateMinute = timeHelper.validate(minute);
    const hour = this.hourAndMinute[0];

    this.handleTimeChange({
      hour,
      minute: validateMinute,
      meridiem: this.meridiem
    });
  }

  handleMeridiemChange(meridiem) {
    const [hour, minute] = this.hourAndMinute;
    this.handleTimeChange({
      hour,
      minute,
      meridiem
    });
  }

  handleTimeChange(options) {
    const { onTimeChange } = this.props;
    onTimeChange && onTimeChange(options);
    this.onTimeChanged(true);
  }

  handleHourAndMinuteChange(time) {
    this.onTimeChanged(true);
    const { onTimeChange, autoMode } = this.props;
    if (autoMode) {
      this.onClearFocus();
    }
    return onTimeChange && onTimeChange(time);
  }

  renderMaterialTheme() {
    const {
      timeMode,
      autoMode,
      draggable,
      language,
      limitDrag,
      minuteStep,
      showTimezone,
      onTimezoneChange,
      timezoneIsEditable,
    } = this.props;

    const { timezoneData } = this.state;
    const [hour, minute] = this.hourAndMinute;

    return (
      <MaterialTheme
        hour={hour}
        minute={minute}
        autoMode={autoMode}
        language={language}
        draggable={draggable}
        limitDrag={limitDrag}
        timezone={timezoneData}
        meridiem={this.meridiem}
        showTimezone={showTimezone}
        phrases={this.languageData}
        clearFocus={this.onClearFocus}
        timeMode={parseInt(timeMode, 10)}
        onTimezoneChange={onTimezoneChange}
        minuteStep={parseInt(minuteStep, 10)}
        timezoneIsEditable={timezoneIsEditable}
        handleHourChange={this.handleHourChange}
        handleMinuteChange={this.handleMinuteChange}
        handleMeridiemChange={this.handleMeridiemChange}
      />
    );
  }

  renderClassicTheme() {
    const { timeMode, colorPalette } = this.props;
    const [hour, minute] = this.hourAndMinute;

    return (
      <ClassicTheme
        hour={hour}
        minute={minute}
        meridiem={this.meridiem}
        colorPalette={colorPalette}
        clearFocus={this.onClearFocus}
        timeMode={parseInt(timeMode, 10)}
        handleTimeChange={this.handleTimeChange}
      />
    );
  }

  render() {
    const {
      theme,
      trigger,
      placeholder,
      withoutIcon,
      colorPalette,
      closeOnOutsideClick
    } = this.props;

    const { focused } = this.state;
    const times = this.formattedTime;

    const pickerPreviewClass = cx(
      'time_picker_preview',
      focused && 'active'
    );
    const containerClass = cx(
      'time_picker_container',
      colorPalette === 'dark' && 'dark'
    );
    const previewContainerClass = cx(
      'preview_container',
      withoutIcon && 'without_icon'
    );

    return (
      <div className={containerClass}>
        { trigger || (
          <Button
            onClick={this.onFocus}
            className={pickerPreviewClass}
          >
            <div className={previewContainerClass}>
              {withoutIcon ? '' : (ICONS.time)}
              {placeholder || times}
            </div>
          </Button>
        ) }
        <OutsideClickHandler
          focused={focused}
          onOutsideClick={this.onClearFocus}
          closeOnOutsideClick={closeOnOutsideClick}
        >
          {theme === 'material'
            ? this.renderMaterialTheme()
            : this.renderClassicTheme()}
        </OutsideClickHandler>
      </div>
    );
  }
}

TimePicker.propTypes = propTypes;
TimePicker.defaultProps = defaultProps;

export default TimePicker;
