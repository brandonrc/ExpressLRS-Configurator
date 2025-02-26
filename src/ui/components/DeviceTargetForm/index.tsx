import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';
import { SxProps, Theme } from '@mui/system';
import Omnibox from '../Omnibox';
import {
  Device,
  FirmwareVersionDataInput,
  Target,
} from '../../gql/generated/types';
import FlashingMethodOptions, {
  sortDeviceTargets,
} from '../FlashingMethodOptions';

const styles: Record<string, SxProps<Theme>> = {
  root: {
    marginY: 2,
  },
  dangerZone: {
    marginBottom: 4,
  },
};

interface FirmwareVersionCardProps {
  currentTarget: Target | null;
  onChange: (data: Target | null) => void;
  deviceOptions: Device[] | null;
  firmwareVersionData: FirmwareVersionDataInput | null;
}

const DeviceTargetForm: FunctionComponent<FirmwareVersionCardProps> = ({
  onChange,
  currentTarget,
  deviceOptions,
  firmwareVersionData,
}) => {
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);

  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  const categorySelectOptions = useMemo(() => {
    if (deviceOptions === null) {
      return [];
    }
    return deviceOptions
      .map((item) => item.category)
      .filter((value, index, array) => array.indexOf(value) === index) // unique values
      .map((category) => {
        return {
          label: category,
          value: category,
        };
      })
      .sort((a, b) => {
        return a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1;
      });
  }, [deviceOptions]);

  const deviceSelectOptions = useMemo(() => {
    if (deviceOptions === null || currentCategory === null) {
      return [];
    }

    return deviceOptions
      .filter((item) => item.category === currentCategory)
      .map((item) => {
        return {
          label: item.name,
          value: item.name,
        };
      })
      .sort((a, b) => {
        return a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1;
      });
  }, [deviceOptions, currentCategory]);

  // Used when currentTarget is changed from Network devices popup
  useEffect(() => {
    const device = deviceOptions?.find((item) =>
      item.targets.find((target) => target.id === currentTarget?.id)
    );

    // verify that if there is a currentTarget that the category and device values match that target
    if (device) {
      if (currentCategory !== device.category) {
        setCurrentCategory(device.category);
      }
      if (currentDevice?.name !== device.name) {
        setCurrentDevice(device);
      }
    }
  }, [currentTarget, currentCategory, currentDevice, deviceOptions]);

  const onCategoryChange = useCallback(
    (value: string | null) => {
      if (value === currentCategory) {
        return;
      }
      if (value === null) {
        setCurrentCategory(null);
      } else {
        setCurrentCategory(value);
      }
      // When category changes, set the current target to null
      setCurrentDevice(null);
      onChange(null);
    },
    [onChange, currentCategory]
  );

  const onDeviceChange = useCallback(
    (value: string | null) => {
      if (value === null) {
        setCurrentDevice(null);
        onChange(null);
      } else if (value !== currentDevice?.name) {
        const device =
          deviceOptions?.find((item) => item.name === value) ?? null;
        setCurrentDevice(device);
        const targets = sortDeviceTargets(device?.targets ?? []);
        onChange(targets[0] ?? null);
      }
    },
    [onChange, currentDevice, deviceOptions]
  );

  /*
    Check if current device & category is present in deviceOptions. If not - reset to default state.
   */
  useEffect(() => {
    if (
      deviceOptions === null ||
      currentDevice === null ||
      currentCategory === null
    ) {
      return;
    }
    const category = deviceOptions?.find(
      (item) => item.category === currentCategory
    );
    const device = deviceOptions?.find(
      (item) => item.name === currentDevice?.name
    );
    if (!category && !device) {
      onCategoryChange(null);
      onDeviceChange(null);
    } else if (category && !device) {
      onDeviceChange(null);
    }
  }, [onCategoryChange, onDeviceChange, currentCategory, currentDevice]);

  const onFlashingMethodChange = (value: Target | null) => {
    onChange(value);
  };

  return (
    <>
      {currentDevice && !currentDevice.verifiedHardware && (
        <Alert severity="warning" sx={styles.dangerZone}>
          <AlertTitle>UNVERIFIED HARDWARE</AlertTitle>
          The manufacturer of this hardware has not provided samples to the
          developers for evaluation and verification, contact them for support
          or proceed at your own risk. Not all features may work.
        </Alert>
      )}
      {deviceOptions && deviceOptions?.length > 0 && (
        <>
          <Box sx={styles.root}>
            <Omnibox
              title="Device category"
              currentValue={
                categorySelectOptions.find(
                  (item) => item.value === currentCategory
                ) ?? null
              }
              onChange={onCategoryChange}
              options={categorySelectOptions}
            />
          </Box>
          <Box sx={styles.root}>
            <Omnibox
              title="Device"
              currentValue={
                deviceSelectOptions.find(
                  (item) => item.value === currentDevice?.name
                ) ?? null
              }
              onChange={onDeviceChange}
              options={deviceSelectOptions}
              // if no category has been selected, disable the target select box
              disabled={currentCategory === null}
            />
          </Box>
        </>
      )}

      {currentCategory && currentDevice && deviceOptions && (
        <FlashingMethodOptions
          onChange={onFlashingMethodChange}
          currentTarget={currentTarget}
          currentDevice={currentDevice}
          firmwareVersionData={firmwareVersionData}
        />
      )}
    </>
  );
};

export default DeviceTargetForm;
